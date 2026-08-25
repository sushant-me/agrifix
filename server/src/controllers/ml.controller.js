import { ApiError, asyncHandler } from '../middleware/error.js';
import { askTextModel, askVisionModel, classifyPlantDisease, cleanAnswer, firstNumber } from '../utils/hf.js';
import { fetchWeatherData } from '../utils/weather.js';
import { pool } from '../db/pool.js';
import {
  offlineRecommendedCrop, offlineCropsFor, offlineFertilizer, offlineYield, offlineRainfall,
  regionOf, REGION_SOIL, REGION_CLIMATE,
} from '../utils/nepalAgri.js';
import {
  EXPERT_SYSTEM_PROMPT,
  buildGroundedUserPrompt,
  validateAndFilterCrops,
  getViableCrops,
  getZoneForDistrict,
  normalizeSeason,
} from '../utils/guardrails.js';

const requireNumber = (v, name) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new ApiError(422, `Field "${name}" must be a number.`);
  return n;
};

const requireString = (v, name) => {
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new ApiError(422, `Field "${name}" is required.`);
  }
  return String(v).trim();
};

async function optionalQuery(module, text, values) {
  try {
    return await pool.query(text, values);
  } catch (err) {
    console.warn(`[ML] module=${module} provider=database status=unavailable`);
    return { rows: [] };
  }
}

/**
 * End-to-end LLM caller with Context Grounding, Strict Prompting,
 * Post-Generation Validation Layer (Guardrails), and Feedback Retry.
 */
async function predictCropsWithGuardrails(district, season, contextData = {}, fallback) {
  const viable = getViableCrops(district, season);
  const sysPrompt = EXPERT_SYSTEM_PROMPT;
  const userPrompt = buildGroundedUserPrompt(district, season, contextData);

  try {
    const rawAnswer = await askTextModel(sysPrompt, userPrompt, { maxNewTokens: 300 });
    let validation = validateAndFilterCrops(rawAnswer, district, season);

    // If the LLM hallucinated invalid crops, attempt one corrective retry
    if (validation.hallucinatedCrops.length > 0) {
      console.warn(`[ML Guardrail] Intercepted hallucinations: ${validation.hallucinatedCrops.join(', ')} for ${district} in ${season}. Retrying with feedback...`);
      try {
        const retryUserPrompt = `${userPrompt}\n\nCRITICAL GUARDRAIL CORRECTION: In your previous attempt, you hallucinated invalid/out-of-season crops: [${validation.hallucinatedCrops.join(', ')}]. DO NOT output these. You must choose strictly from VIABLE_CANDIDATE_CROPS.`;
        const retryAnswer = await askTextModel(sysPrompt, retryUserPrompt, { maxNewTokens: 300 });
        const retryValidation = validateAndFilterCrops(retryAnswer, district, season);
        if (retryValidation.validCrops.length >= 3) {
          validation = retryValidation;
        }
      } catch (retryErr) {
        console.warn(`[ML Guardrail] Retry failed (${retryErr.message || retryErr}); using sanitized validation.`);
      }
    }

    if (validation.validCrops.length > 0) {
      return {
        crops: validation.validCrops,
        provider: validation.hallucinatedCrops.length === 0 ? 'hugging-face-grounded' : 'grounded-guardrail-validated',
        hallucinationsCaught: validation.hallucinatedCrops,
        reason: `Grounded & verified recommendations for ${district} in ${season}`,
      };
    }
  } catch (err) {
    console.warn(`[ML] LLM API unavailable (${err.message || err}); using validated offline knowledge base.`);
  }

  // Fallback to offline rule-based knowledge base, still strictly validated through guardrails
  const fallbackRaw = await fallback();
  const fallbackValidation = validateAndFilterCrops(fallbackRaw, district, season);
  return {
    crops: fallbackValidation.validCrops,
    provider: 'offline-rule-based',
    hallucinationsCaught: fallbackValidation.hallucinatedCrops,
    reason: `Indicative rule-based guidance for ${district} in ${season}`,
  };
}

export const cropRecommendation = asyncHandler(async (req, res) => {
  const location = requireString(req.body.location, 'location');
  const season = typeof req.body.season === 'string' && req.body.season.trim()
    ? req.body.season.trim()
    : 'Any';
  const zone = regionOf(location, location);
  const soilDefaults = REGION_SOIL[zone];
  const seasonalClimate = getSeasonalClimate(location, season);

  // Dynamic climate parameters matching the selected season and location
  let t = seasonalClimate.t;
  let h = seasonalClimate.h;
  let rainfall = seasonalClimate.rainfall;
  let source = 'seasonal-climate-model';

  // If live weather is available and matches current season or "Any", use live readings
  if (season === 'Any') {
    try {
      const wx = await fetchWeatherData(location);
      if (wx.temperature != null && wx.humidity != null) {
        t = Number(wx.temperature); h = Number(wx.humidity); source = 'live-weather';
      }
    } catch { /* fall through to seasonal defaults */ }
  }

  // Auto-resolve soil: latest lab record for the farm zone → regional default
  const levelToMg = (v, fallback) => ({ low: 40, medium: 80, high: 120 }[String(v || '').toLowerCase().trim()] ?? fallback);
  let n = soilDefaults.n, p = soilDefaults.p, k = soilDefaults.k;
  let ph = seasonalClimate.ph;
  let soil = `Auto (${zone} default)`;
  const soilRec = await optionalQuery('cropRecommendation',
    `SELECT nitrogen_level, phosphorus_level, potassium_level, ph_value
     FROM farm_soil_records WHERE farm_zone ILIKE $1 ORDER BY recorded_at DESC LIMIT 1`,
    [`%${location}%`]
  );
  if (soilRec.rows[0]) {
    const r = soilRec.rows[0];
    n = levelToMg(r.nitrogen_level, n);
    p = levelToMg(r.phosphorus_level, p);
    k = levelToMg(r.potassium_level, k);
    if (r.ph_value != null) ph = Number(r.ph_value);
    soil = 'Auto (lab record)';
  }

  const result = await predictCropsWithGuardrails(
    location,
    season,
    { temperature: t, humidity: h, rainfall, ph, n, p, k },
    async () => (await offlineRecommendedCrop({ n, p, k, t, h, ph, r: rainfall, season, district: location })).crops
  );

  const crops = result.crops;
  if (!crops.length) throw new ApiError(502, 'Crop recommendation failed.');

  console.info(`[ML] module=cropRecommendation provider=${result.provider} status=success crops=${crops.join(',')}`);
  res.json({
    success: true,
    data: {
      crops,
      crop: crops[0],
      context: {
        location,
        season,
        period: seasonalClimate.period,
        temperature: t,
        humidity: h,
        rainfall,
        rainfallUnit: season === 'Any' ? 'mm/year (annual)' : 'mm/season',
        ph,
        soil,
        n,
        p,
        k,
        source,
      },
      metadata: {
        provider: result.provider,
        mode: 'grounded-guardrail-guidance',
        soilIsEstimated: !soil.includes('lab record'),
        reason: result.reason,
        hallucinationsCaught: result.hallucinationsCaught,
      },
      message: `Indicative crop guidance: ${crops.join(', ')}`,
    },
  });
});

export const cropPrediction = asyncHandler(async (req, res) => {
  const state = requireString(req.body.state, 'state');
  const district = requireString(req.body.district, 'district');
  const season = requireString(req.body.season, 'season');

  const result = await predictCropsWithGuardrails(
    district,
    season,
    { province: state },
    async () => await offlineCropsFor(state, district, season)
  );

  const crops = result.crops.join(', ');
  if (!crops) throw new ApiError(502, 'Crop prediction failed.');

  console.info(`[ML] module=cropPrediction provider=${result.provider} status=success district=${district} season=${season}`);
  res.json({
    success: true,
    data: {
      crops,
      metadata: {
        provider: result.provider,
        mode: 'grounded-guardrail-guidance',
        hallucinationsCaught: result.hallucinationsCaught,
      },
      message: `Indicative crops grown in ${district} during the ${season} season: ${crops}`,
    },
  });
});

export const fertilizerRecommendation = asyncHandler(async (req, res) => {
  const location = requireString(req.body.location, 'location');
  const crop = requireString(req.body.crop, 'crop');
  const zone = regionOf(location, location);
  const soilDefaults = REGION_SOIL[zone];
  const climateDefaults = REGION_CLIMATE[zone];

  // Auto-resolve weather: live API → last cached record → regional default
  let t, h, source = 'region-defaults';
  try {
    const wx = await fetchWeatherData(location);
    if (wx.temperature != null && wx.humidity != null) {
      t = Number(wx.temperature); h = Number(wx.humidity); source = 'live-weather';
    }
  } catch { /* fall through to cache / defaults */ }
  if (t === undefined) {
    const cached = await optionalQuery('fertilizerRecommendation',
      `SELECT temperature, humidity FROM weather_data WHERE city ILIKE $1
       ORDER BY recorded_at DESC LIMIT 1`,
      [`%${location}%`]
    );
    if (cached.rows[0]) {
      t = Number(cached.rows[0].temperature); h = Number(cached.rows[0].humidity); source = 'cached-weather';
    }
  }
  if (t === undefined) { t = climateDefaults.t; h = climateDefaults.h; }

  // Auto-resolve soil: latest lab record for the farm zone → regional default
  const levelToMg = (v, fallback) => ({ low: 40, medium: 80, high: 120 }[String(v || '').toLowerCase().trim()] ?? fallback);
  let n = soilDefaults.n, p = soilDefaults.p, k = soilDefaults.k;
  let soilMoisture = soilDefaults.moisture;
  let soil = `Auto (${zone} default)`;
  const soilRec = await optionalQuery('fertilizerRecommendation',
    `SELECT nitrogen_level, phosphorus_level, potassium_level, ph_value
     FROM farm_soil_records WHERE farm_zone ILIKE $1 ORDER BY recorded_at DESC LIMIT 1`,
    [`%${location}%`]
  );
  if (soilRec.rows[0]) {
    const r = soilRec.rows[0];
    n = levelToMg(r.nitrogen_level, n);
    p = levelToMg(r.phosphorus_level, p);
    k = levelToMg(r.potassium_level, k);
    soil = r.ph_value != null ? `Auto (soil pH ${r.ph_value})` : 'Auto (lab record)';
  }

  const answer = await offlineFertilizer(crop, {
    soil: { n, p, k, ph: soilRec.rows[0]?.ph_value || 6.5 },
    allowOllama: true,
  });

  const fertilizer = String(answer).trim();
  if (!fertilizer) throw new ApiError(502, 'Fertilizer recommendation failed.');
  res.json({
    success: true,
    data: {
      fertilizer,
      context: {
        location, crop, temperature: t, humidity: h, soilMoisture, soil, n, p, k, source,
      },
      metadata: { provider: 'grounded-moald-rules', mode: 'indicative-guidance', soilIsEstimated: !soil.includes('lab record') },
      message: `Recommended Fertilizer Plan for ${crop} in ${location}: ${fertilizer}`,
    },
  });
});

export const yieldPrediction = asyncHandler(async (req, res) => {
  const state = requireString(req.body.state, 'state');
  const district = requireString(req.body.district, 'district');
  const season = requireString(req.body.season, 'season');
  const crops = requireString(req.body.crops, 'crops');
  const area = requireNumber(req.body.area, 'area');
  if (area <= 0 || area > 10000) throw new ApiError(422, 'Field "area" must be greater than 0 and at most 10,000 hectares.');

  const region = regionOf(state, district);
  const yieldResult = await offlineYield(crops, area, { region, season, allowOllama: true });
  const totalYield = typeof yieldResult === 'object' ? yieldResult.total : yieldResult;
  const perHa = typeof yieldResult === 'object' ? yieldResult.perHa : (totalYield / area).toFixed(1);

  const yieldValue = `${totalYield}`;
  res.json({
    success: true,
    data: {
      yield: yieldValue,
      perHectare: `${perHa}`,
      unit: 'quintals',
      metadata: { provider: 'grounded-moald-benchmark', mode: 'indicative-guidance', agroZone: region },
      message: `Estimated yield for ${crops} in ${district} (${season} season): ${yieldValue} quintals (~${perHa} quintals/ha over ${area} ha)`,
    },
  });
});

export const rainfallPrediction = asyncHandler(async (req, res) => {
  const region = requireString(req.body.region, 'region');
  const month = requireString(req.body.month, 'month');
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const normalizedMonth = month.trim().toLowerCase();
  const monthKey = monthNames.find((name) => name.startsWith(normalizedMonth.slice(0, 3)));
  if (!monthKey || normalizedMonth.length < 3) {
    throw new ApiError(422, 'Field "month" must be one calendar month (e.g. July or Jul); annual and seasonal totals are not supported.');
  }
  if (!/^(terai|hill|mountain)$/i.test(region.trim())) {
    throw new ApiError(422, 'Field "region" must be Terai, Hill, or Mountain. Province-wide rainfall is not supported because each province spans multiple climate zones.');
  }

  const mm = await offlineRainfall(region, monthKey, { allowOllama: true });
  console.info('[ML] module=rainfallPrediction provider=grounded-dhm-benchmark status=success');
  res.json({
    success: true,
    data: {
      rainfall: `${mm}`,
      unit: 'mm/month',
      metadata: { provider: 'grounded-dhm-benchmark', mode: 'indicative-guidance', region, month: monthKey },
      message: `Typical monthly rainfall in ${region} during ${monthKey.charAt(0).toUpperCase() + monthKey.slice(1)}: ${mm} mm/month`,
    },
  });
});

const DISEASE_SYSTEM = `You are a senior plant pathologist for Nepal. Analyse the plant leaf photo and report:
1) the most likely disease (or "Healthy"), 2) how confident you are, 3) the visible symptoms,
4) what will happen if left untreated (spread, yield loss), 5) practical treatment steps to save the plant,
6) a day-by-day action plan for the next 7 days, and 7) how to grow this plant well going forward.
Use plain English, SI units, Nepal-appropriate advice (fungicides/pesticides available in Nepal, organic
options like neem oil and Trichoderma), and reply ONLY with a JSON object with exactly these keys:
{"plant","disease","confidence","severity","symptoms","whatWillHappen","treatment","actionPlan","growingGuide"}
where treatment is an array of strings, actionPlan is an array of {day, tasks}, growingGuide is an array
of strings. No markdown, no extra text outside the JSON.`;

const offlineDiseaseGuidance = (plant) => ({
  plant,
  disease: 'Not identified (image analysis offline)',
  confidence: 'low',
  severity: 'unknown',
  symptoms: `No image analysis was possible right now for ${plant || 'this plant'}. If your leaf shows spots,
yellowing, wilting or mould, start with basic protective steps.`,
  whatWillHappen: 'Left untreated, fungal or bacterial infections spread to neighbouring leaves and can cut yield by 30–70%.',
  treatment: [
    'Remove and burn the worst affected leaves; do not compost them.',
    `Spray neem oil solution (5 ml per litre) every 7 days as a natural first treatment for ${plant || 'this plant'}.`,
    'If infection spreads, apply a fungicide available in Nepal (e.g. copper oxychloride or mancozeb) exactly per the label.',
    'Stop overhead watering; water the base of the plant so leaves stay dry.',
  ],
  actionPlan: [
    { day: 'Day 1–2', tasks: 'Isolate the sick plant and strip off heavily damaged leaves.' },
    { day: 'Day 3–4', tasks: 'Spray neem oil or a mild fungicide and improve airflow around the plant.' },
    { day: 'Day 5–7', tasks: 'Check daily for new spots; repeat the spray if needed and feed a light balanced fertiliser.' },
  ],
  growingGuide: [
    'Plant in well-drained soil with good sunlight (6–8 hours daily).',
    'Water at the base in the morning; avoid wetting the leaves.',
    'Keep 30–40 cm spacing between plants for airflow.',
    'Mulch the soil and rotate crops each season to break disease cycles.',
  ],
});

const diseaseGuidance = (label, plant) => {
  const name = plant || 'this plant';
  const normalized = label.toLowerCase();
  if (/common rust/.test(normalized)) {
    return {
      symptoms: 'Rust-coloured raised spots or pustules may appear on both sides of the leaf and can reduce photosynthesis.',
      treatment: ['Remove badly affected leaves and dispose of them away from the field.', 'Improve airflow and avoid overhead irrigation.', 'Apply a labelled fungicide approved for the crop, such as a triazole product, and follow the harvest interval.', 'Do not save seed from heavily affected plants; rotate away from maize for the next season.'],
      actionPlan: [{ day: 'Day 1', tasks: 'Inspect nearby plants and remove the most affected leaves.' }, { day: 'Day 2–3', tasks: 'Improve spacing and airflow; water only at the soil line.' }, { day: 'Day 4–7', tasks: 'Monitor new leaves and use a registered fungicide only if the infection is spreading.' }],
      growingGuide: ['Use resistant seed suited to the local area.', 'Keep the field weed-free and avoid dense planting.', 'Rotate maize with a non-host crop and remove crop residue after harvest.'],
    };
  }
  if (/powdery mildew/.test(normalized)) {
    return {
      symptoms: 'White, powder-like fungal growth may cover the leaf surface, followed by yellowing and early leaf drop.',
      treatment: ['Remove the most infected leaves and improve sunlight and airflow.', 'Avoid wetting foliage and water at the plant base.', 'Use a labelled sulphur or fungicide product suitable for the crop; never spray sulphur in hot weather.', `For ${name}, follow the product label and observe its pre-harvest interval.`],
      actionPlan: [{ day: 'Day 1', tasks: 'Isolate the plant, remove heavily infected leaves and clean tools.' }, { day: 'Day 2–3', tasks: 'Thin crowded growth and keep leaves dry.' }, { day: 'Day 4–7', tasks: 'Check new growth daily and treat only according to the product label if symptoms continue.' }],
      growingGuide: ['Give plants adequate spacing and morning sunlight.', 'Avoid excess nitrogen fertiliser, which encourages soft crowded growth.', 'Remove infected debris after harvest.'],
    };
  }
  if (/yellow leaf curl virus/.test(normalized)) {
    return {
      symptoms: 'Leaf curling, yellowing and stunted growth are consistent with a possible viral leaf-curl pattern spread by whiteflies.',
      treatment: ['There is no curative spray for a virus; remove and destroy severely affected plants.', 'Inspect leaf undersides for whiteflies and use yellow sticky traps.', 'Control whiteflies with an approved product or insecticidal soap according to its label.', 'Remove nearby weeds and do not take cuttings or seed from affected plants.'],
      actionPlan: [{ day: 'Day 1', tasks: 'Separate affected plants and inspect neighbouring leaves for whiteflies.' }, { day: 'Day 2–3', tasks: 'Remove severely affected plants and place sticky traps near healthy plants.' }, { day: 'Day 4–7', tasks: 'Monitor new growth and control whiteflies using only a crop-approved label treatment.' }],
      growingGuide: ['Use certified virus-free seedlings or seed.', 'Install insect netting where practical and keep weeds controlled.', 'Choose locally recommended resistant varieties for the next planting.'],
    };
  }
  return offlineDiseaseGuidance(name);
};

const parseDiseaseJson = (text) => {
  const cleaned = cleanAnswer(text);
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === 'object') return obj;
  } catch {
    /* fall through to loose extraction */
  }
  const part = (key) => {
    const m = cleaned.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
    return m ? m[1] : '';
  };
  return {
    plant: part('plant'),
    disease: part('disease') || 'Unidentified',
    confidence: part('confidence') || 'medium',
    severity: part('severity') || 'unknown',
    symptoms: part('symptoms'),
    whatWillHappen: part('whatWillHappen'),
    treatment: [part('treatment')].filter(Boolean),
    actionPlan: [],
    growingGuide: [],
  };
};

/**
 * Normalise the parsed answer: some model runs return arrays as strings or
 * drop whole sections, so coerce shapes and fill missing sections from the
 * offline template so the user always gets full guidance.
 */
const normalizeDisease = (parsed, plant) => {
  const out = { ...parsed, plant: plant || parsed.plant || 'Unidentified plant' };

  const toList = (v) => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === 'string' && v.trim()) {
      return v
        .split(/\n+/)
        .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*])\s*/, '').trim())
        .filter(Boolean);
    }
    return [];
  };

  out.symptoms = Array.isArray(out.symptoms) ? out.symptoms.join(' ') : out.symptoms;
  out.confidence = String(out.confidence ?? 'medium');
  out.severity = String(out.severity ?? 'unknown');

  if (!Array.isArray(out.actionPlan)) {
    out.actionPlan = toList(out.actionPlan).map((line, i) => ({
      day: `Day ${i * 2 + 1}–${i * 2 + 2}`,
      tasks: line,
    }));
  } else {
    out.actionPlan = out.actionPlan.map((s, i) => ({
      day: String(s.day ?? `Day ${i + 1}`),
      tasks: Array.isArray(s.tasks) ? s.tasks.join('; ') : String(s.tasks ?? ''),
    }));
  }

  const isHealthy = /healthy/i.test(out.disease);
  const base = offlineDiseaseGuidance(out.plant);
  out.whatWillHappen = out.whatWillHappen || base.whatWillHappen;
  if (isHealthy) {
    out.disease = 'Healthy (no disease detected)';
    out.symptoms = out.symptoms || 'The leaf shows no clear signs of disease.';
    out.treatment = toList(out.treatment).length
      ? toList(out.treatment)
      : ['Keep up your current care routine — watering at the base, good airflow and balanced feeding.',
        'Continue weekly neem-oil spray (5 ml per litre) as a preventive measure.',
        'Remove any weak or yellowing leaves promptly to avoid future infections.'];
    out.actionPlan = out.actionPlan.length
      ? out.actionPlan
      : [{ day: 'Day 1–3', tasks: 'Observe the plant daily and keep leaves dry.' },
         { day: 'Day 4–7', tasks: 'Spray preventive neem oil and feed a light balanced fertiliser.' }];
  } else {
    out.treatment = toList(out.treatment).length ? toList(out.treatment) : base.treatment;
    out.actionPlan = out.actionPlan.length ? out.actionPlan : base.actionPlan;
  }
  out.growingGuide = toList(out.growingGuide).length ? toList(out.growingGuide) : base.growingGuide;
  return out;
};

/**
 * Plant disease prediction from a leaf photo. Sends the image to a free
 * vision-language model; if no vision model is reachable, falls back to a
 * generic protective plan (plant name optional) so the page still works.
 */
export const plantDiseasePrediction = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(422, 'Please upload a leaf photo (JPG, PNG, GIF or WEBP).');
  const plant = (req.body.plant || '').toString().trim().slice(0, 80);
  const image = file.buffer.toString('base64');

  try {
    const prediction = await classifyPlantDisease(file.buffer);
    const base = diseaseGuidance(prediction.label, plant || 'Unidentified plant');
    const healthy = /healthy/i.test(prediction.label);
    const confidence = Math.round(prediction.score * 100);
    const data = {
      ...base,
      plant: plant || prediction.label.split(' with ')[0] || 'Unidentified plant',
      disease: healthy ? 'Healthy (no disease detected)' : prediction.label,
      confidence: `${confidence}%`,
      severity: healthy ? 'none' : confidence >= 70 ? 'high' : confidence >= 40 ? 'moderate' : 'low',
      symptoms: healthy
        ? 'The classifier found no clear disease pattern in the submitted leaf photo.'
        : `${base.symptoms} Confirm the result with a local agricultural expert before applying pesticides.`,
      provider: 'hugging-face-plant-classifier',
      mode: 'image-classification',
      identified: !healthy && confidence >= 40,
      lowConfidence: !healthy && confidence < 40,
      offline: false,
    };
    console.info(`[AI] module=plantDisease provider=hugging-face-plant-classifier label=${prediction.label} score=${prediction.score.toFixed(3)}`);
    return res.json({ success: true, data });
  } catch (classifierError) {
    console.warn(`[AI] plant classifier unavailable (${classifierError.message || classifierError}); trying vision model.`);
  }

  try {
    const answer = await askVisionModel(
      DISEASE_SYSTEM,
      `Plant name: ${plant || 'not provided'}. Analyse this single leaf photo.`,
      image,
      file.mimetype || 'image/jpeg'
    );
    const data = normalizeDisease(parseDiseaseJson(answer), plant);
    console.info('[AI] module=plantDisease provider=hugging-face status=success');
    return res.json({
      success: true,
      data: { ...data, identified: true, provider: 'hugging-face', mode: 'vision-model' },
    });
  } catch (err) {
    console.warn(`[AI] module=plantDisease provider=offline status=fallback reason=${err.message || err}`);
    const data = offlineDiseaseGuidance(plant || 'Unidentified plant');
    return res.json({
      success: true,
      data: {
        ...data,
        offline: true,
        identified: false,
        provider: 'offline-guidance',
        mode: 'safe-no-diagnosis',
        reason: 'The vision model is unavailable, so disease-specific identification was not made.',
      },
    });
  }
});
