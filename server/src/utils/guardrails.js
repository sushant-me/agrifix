/**
 * AgriSmart Crop Guardrails & Hallucination Mitigation (Node.js)
 * --------------------------------------------------------------
 * Enforces pre-processing context grounding, prompt engineering constraints,
 * and post-generation validation layers against Nepal MoALD agricultural datasets.
 */

export const AGRO_ZONES = {
  mountain: {
    districts: [
      'mustang', 'dolpa', 'jumla', 'humla', 'mugu', 'kalikot', 'manang',
      'rasuwa', 'solukhumbu', 'sankhuwasabha', 'taplejung', 'bajura',
      'darchula', 'dolakha', 'rukum west'
    ],
    default_crops: ['barley', 'buckwheat', 'potato', 'millet', 'wheat', 'pea', 'cabbage'],
  },
  terai: {
    districts: [
      'jhapa', 'morang', 'sunsari', 'saptari', 'siraha', 'dhanusha', 'mahottari',
      'sarlahi', 'rautahat', 'bara', 'parsa', 'chitwan', 'nawalpur',
      'nawalparasi east', 'nawalparasi west', 'rupandehi', 'kapilvastu', 'kapilbastu',
      'dang', 'banke', 'bardiya', 'kailali', 'kanchanpur', 'udayapur'
    ],
    default_crops: ['paddy', 'wheat', 'maize', 'mustard', 'sugarcane', 'lentil', 'potato', 'chickpea', 'jute'],
  },
  hill: {
    districts: [
      'kathmandu', 'lalitpur', 'bhaktapur', 'kaski', 'gorkha', 'tanahun', 'lamjung',
      'syangja', 'parbat', 'baglung', 'myagdi', 'dhading', 'nuwakot', 'kavrepalanchok',
      'sindhupalchok', 'sindhuli', 'makwanpur', 'ramechhap', 'okhaldhunga', 'khotang',
      'bhojpur', 'dhankuta', 'terhathum', 'panchthar', 'ilam', 'illam', 'palpa',
      'gulmi', 'arghakhanchi', 'pyuthan', 'rolpa', 'rukum east', 'salyan', 'surkhet',
      'dailekh', 'jajarkot', 'achham', 'doti', 'dadeldhura', 'baitadi', 'bajhang'
    ],
    default_crops: ['maize', 'millet', 'paddy', 'wheat', 'potato', 'mustard', 'ginger', 'cardamom', 'cauliflower', 'tomato', 'lentil', 'buckwheat', 'barley', 'tea'],
  },
};

export const SEASON_CROP_MATRIX = {
  winter: {
    terai: ['wheat', 'mustard', 'potato', 'lentil', 'chickpea', 'barley', 'pea', 'sugarcane', 'cauliflower', 'cabbage', 'radish'],
    hill: ['wheat', 'barley', 'mustard', 'potato', 'lentil', 'pea', 'cauliflower', 'cabbage', 'radish', 'buckwheat', 'garlic', 'onion'],
    mountain: ['barley', 'buckwheat', 'wheat', 'potato', 'pea', 'radish'],
  },
  monsoon: {
    terai: ['paddy', 'rice', 'maize', 'sugarcane', 'jute', 'sesame', 'soybean', 'groundnut', 'turmeric'],
    hill: ['paddy', 'rice', 'maize', 'millet', 'ginger', 'soybean', 'potato', 'cardamom', 'tea', 'turmeric', 'cucumber', 'pumpkin'],
    mountain: ['potato', 'buckwheat', 'barley', 'millet', 'maize', 'mustard'],
  },
  summer: {
    terai: ['maize', 'mung bean', 'cucumber', 'pumpkin', 'tomato', 'vegetables', 'sunflower', 'spring paddy', 'watermelon'],
    hill: ['maize', 'ginger', 'tomato', 'millet', 'cucumber', 'pumpkin', 'vegetables', 'capsicum', 'french bean', 'potato'],
    mountain: ['potato', 'buckwheat', 'barley', 'spinach', 'pea', 'vegetables'],
  },
  autumn: {
    terai: ['cauliflower', 'cabbage', 'potato', 'mustard', 'radish', 'paddy', 'sugarcane', 'brinjal', 'tomato'],
    hill: ['cauliflower', 'cabbage', 'potato', 'mustard', 'radish', 'cardamom', 'maize', 'ginger', 'millet', 'pea'],
    mountain: ['buckwheat', 'barley', 'potato', 'cabbage', 'cauliflower'],
  },
  spring: {
    terai: ['maize', 'mung bean', 'sunflower', 'vegetables', 'cucumber', 'tomato', 'sugarcane'],
    hill: ['maize', 'potato', 'ginger', 'tomato', 'cucumber', 'capsicum', 'tea'],
    mountain: ['barley', 'buckwheat', 'potato', 'pea'],
  },
};

export const PROHIBITED_COMBINATIONS = {
  winter: {
    all: ['ginger', 'paddy', 'rice', 'jute', 'watermelon', 'cucumber'],
    hill: ['ginger', 'paddy', 'rice', 'maize', 'millet', 'jute', 'sugarcane'],
    mountain: ['ginger', 'paddy', 'rice', 'maize', 'sugarcane', 'tomato', 'jute', 'tea'],
  },
  monsoon: {
    all: ['mustard', 'wheat', 'barley', 'chickpea'],
  },
};

export const CROP_ALIASES = {
  rice: 'paddy',
  dhan: 'paddy',
  'paddy rice': 'paddy',
  corn: 'maize',
  makai: 'maize',
  gahun: 'wheat',
  kodo: 'millet',
  'finger millet': 'millet',
  jau: 'barley',
  fapar: 'buckwheat',
  phapar: 'buckwheat',
  alu: 'potato',
  aloo: 'potato',
  tori: 'mustard',
  sarson: 'mustard',
  rayo: 'mustard',
  ukhu: 'sugarcane',
  masuro: 'lentil',
  masur: 'lentil',
  chana: 'chickpea',
  gram: 'chickpea',
  chiya: 'tea',
  aduwa: 'ginger',
  alainchi: 'cardamom',
  'large cardamom': 'cardamom',
  kauli: 'cauliflower',
  gobi: 'cabbage',
  bandagobi: 'cabbage',
  golbheda: 'tomato',
  tamatar: 'tomato',
  kerau: 'pea',
  matar: 'pea',
  mula: 'radish',
  bhatmas: 'soybean',
};

export function normalizeCropName(name) {
  const clean = String(name || '').replace(/[^a-zA-Z\s-]/g, '').trim().toLowerCase();
  return CROP_ALIASES[clean] || clean;
}

export function normalizeSeason(season) {
  const s = String(season || '').toLowerCase().trim();
  if (/(winter|rabi|poush|magh|falgun|cool|cold|december|january|february)/.test(s)) return 'winter';
  if (/(monsoon|kharif|asar|ashad|shrawan|bhadra|barsha|july|august)/.test(s)) return 'monsoon';
  if (/(summer|chaitra|baishak|baisakh|jeth|jestha|may|june)/.test(s)) return 'summer';
  if (/(autumn|post.?monsoon|ashoj|asoj|kartik|mangsir|september|october|november)/.test(s)) return 'autumn';
  if (/(spring|pre.?monsoon|march|april)/.test(s)) return 'spring';
  return 'monsoon';
}

export function getZoneForDistrict(district) {
  const d = String(district || '').toLowerCase().trim();
  for (const [zone, data] of Object.entries(AGRO_ZONES)) {
    if (data.districts.includes(d)) return zone;
  }
  for (const [zone, data] of Object.entries(AGRO_ZONES)) {
    if (data.districts.some((dist) => dist.includes(d) || d.includes(dist))) return zone;
  }
  return 'hill';
}

/**
 * Pre-Processing / Context Grounding:
 * Resolves viable crops for a district + season combination.
 */
export function getViableCrops(district, season) {
  const zone = getZoneForDistrict(district);
  const normSeason = normalizeSeason(season);

  const seasonData = SEASON_CROP_MATRIX[normSeason] || SEASON_CROP_MATRIX.monsoon;
  const viable = (seasonData[zone] || seasonData.hill || []).slice();

  const prohibited = PROHIBITED_COMBINATIONS[normSeason] || {};
  const allProhibited = new Set([...(prohibited.all || []), ...(prohibited[zone] || [])]);

  const filtered = viable.filter((crop) => !allProhibited.has(crop));
  return [...new Set(filtered)];
}

/**
 * Strict System Prompt for LLM with Nepal Agricultural constraints.
 */
export const EXPERT_SYSTEM_PROMPT = `You are a Senior Agricultural Scientist and Agronomist for Nepal (Ministry of Agriculture and Livestock Development / DOA standards).
Your responsibility is to provide accurate, biologically sound, and locally verified crop recommendations for farmers in Nepal.

CRITICAL CONSTRAINTS & GUARDRAILS:
1. STRICT CONTEXT BOUNDARY: You must ONLY recommend crops from the provided "VIABLE_CANDIDATE_CROPS" list for the given district and season.
2. NO SEASONAL OR GEOGRAPHIC HALLUCINATIONS:
   - NEVER recommend warm-season or frost-sensitive crops (such as Ginger, Paddy/Rice, Maize) during Winter or Rabi in Hilly or Mountain districts (like Gorkha, Kathmandu, Solukhumbu).
   - NEVER recommend lowland tropical crops for alpine mountain zones.
3. OUTPUT FORMAT: Reply ONLY with a comma-separated list of 3 to 6 recommended crops chosen strictly from the allowed candidate pool, followed by a one-sentence agronomic rationale. Format:
CROPS: <Crop1>, <Crop2>, <Crop3>
RATIONALE: <Short one-sentence explanation>
Do not include any other commentary, disclaimers, or unverified crop names.`;

/**
 * Builds grounded user prompt.
 */
export function buildGroundedUserPrompt(district, season, contextData = {}) {
  const zone = getZoneForDistrict(district);
  const normSeason = normalizeSeason(season);
  const viable = getViableCrops(district, season);
  const viableFormatted = viable.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');

  let prompt = `Location: ${district} (Agro-Ecological Zone: ${zone.charAt(0).toUpperCase() + zone.slice(1)})
Season: ${season} (Category: ${normSeason.charAt(0).toUpperCase() + normSeason.slice(1)})
VIABLE_CANDIDATE_CROPS (Ground Truth Constraints): [${viableFormatted}]`;

  if (Object.keys(contextData).length > 0) {
    prompt += `\nSoil & Weather Context: ${JSON.stringify(contextData)}`;
  }

  prompt += `\n\nTask: Select 3 to 6 best suited crops from VIABLE_CANDIDATE_CROPS for ${district} in ${season}. Follow the required output format exactly.`;
  return prompt;
}

/**
 * Post-Generation Validation (Guardrails):
 * Intercepts LLM output, drops hallucinations, sanitizes crop names.
 */
export function validateAndFilterCrops(llmOutputOrArray, district, season) {
  let suggested = [];
  if (Array.isArray(llmOutputOrArray)) {
    suggested = llmOutputOrArray.map(String);
  } else {
    const text = String(llmOutputOrArray || '').trim();
    const match = text.match(/CROPS:\s*([^\n\r]+)/i);
    if (match) {
      suggested = match[1].split(',').map((s) => s.trim());
    } else {
      suggested = text
        .replace(/^(RATIONALE|EXPLANATION|NOTE):.*$/gim, '')
        .split(/[,;\n•\d+\.]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);
    }
  }

  const viable = getViableCrops(district, season);
  const viableSet = new Set(viable.map((c) => c.toLowerCase()));

  const normSeason = normalizeSeason(season);
  const zone = getZoneForDistrict(district);
  const prohibited = PROHIBITED_COMBINATIONS[normSeason] || {};
  const allProhibited = new Set([...(prohibited.all || []), ...(prohibited[zone] || [])]);

  const validCrops = [];
  const hallucinatedCrops = [];

  for (const raw of suggested) {
    const normalized = normalizeCropName(raw);
    if (!normalized) continue;

    if (allProhibited.has(normalized)) {
      hallucinatedCrops.push(raw);
      console.warn(`[GUARDRAIL INTERCEPT] Dropped prohibited crop '${raw}' (${normalized}) for ${district} in ${season}.`);
      continue;
    }

    if (viableSet.has(normalized) || viable.some((v) => v.includes(normalized) || normalized.includes(v))) {
      const cap = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      if (!validCrops.includes(cap)) validCrops.push(cap);
    } else {
      hallucinatedCrops.push(raw);
      console.warn(`[GUARDRAIL INTERCEPT] Dropped unverified crop '${raw}' for ${district} in ${season}.`);
    }
  }

  // Supplement if too few valid crops survived validation
  if (validCrops.length < 3) {
    for (const v of viable) {
      const cap = v.charAt(0).toUpperCase() + v.slice(1);
      if (!validCrops.includes(cap)) validCrops.push(cap);
      if (validCrops.length >= 4) break;
    }
  }

  return {
    validCrops: validCrops.slice(0, 6),
    hallucinatedCrops,
    district,
    season,
    agroZone: zone,
    status: hallucinatedCrops.length === 0 ? 'passed' : 'filtered',
    message: `Indicative crop guidance for ${district} in ${season}: ${validCrops.slice(0, 6).join(', ')}`,
  };
}
