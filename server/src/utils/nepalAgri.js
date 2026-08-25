/**
 * Bundled, deterministic Nepal-agriculture guidance. It is not a trained model
 * and must be presented as indicative guidance. Ollama is disabled by default
 * for these numerical/classification-style features because it is not a
 * deterministic prediction model.
 */

import { askOllama, isOllamaEnabled } from './ollama.js';
import { cleanAnswer, firstNumber } from './hf.js';

const OLLAMA_CONTEXT =
  'You are a Nepal agricultural expert (DOA / MoALD reference data). Keep answers short and follow the requested format exactly.';

export const NEPAL_CROPS = {
  paddy: { aliases: ['rice', 'paddy', 'dhan'], fertilizer: 'Urea 100 kg/ha + DAP 60 kg/ha + MOP 40 kg/ha', yield: 45 },
  maize: { aliases: ['maize', 'corn', 'makai'], fertilizer: 'Urea 120 kg/ha + DAP 60 kg/ha + MOP 30 kg/ha', yield: 35 },
  wheat: { aliases: ['wheat', 'gahun'], fertilizer: 'Urea 90 kg/ha + DAP 45 kg/ha + MOP 25 kg/ha', yield: 25 },
  millet: { aliases: ['millet', 'kodo'], fertilizer: 'Urea 60 kg/ha + DAP 30 kg/ha', yield: 18 },
  barley: { aliases: ['barley', 'jau'], fertilizer: 'Urea 50 kg/ha + DAP 30 kg/ha', yield: 20 },
  buckwheat: { aliases: ['buckwheat', 'fapar'], fertilizer: 'Urea 40 kg/ha + DAP 25 kg/ha', yield: 12 },
  potato: { aliases: ['potato', 'alu'], fertilizer: 'Urea 130 kg/ha + DAP 90 kg/ha + MOP 80 kg/ha', yield: 160 },
  mustard: { aliases: ['mustard', 'tori', 'sarson'], fertilizer: 'Urea 60 kg/ha + DAP 40 kg/ha', yield: 10 },
  sugarcane: { aliases: ['sugarcane', 'ukhu'], fertilizer: 'Urea 200 kg/ha + DAP 90 kg/ha + MOP 120 kg/ha', yield: 550 },
  lentil: { aliases: ['lentil', 'masuro'], fertilizer: 'Urea 20 kg/ha + DAP 40 kg/ha + MOP 20 kg/ha', yield: 11 },
  chickpea: { aliases: ['chickpea', 'chana', 'gram'], fertilizer: 'Urea 20 kg/ha + DAP 45 kg/ha', yield: 13 },
  tea: { aliases: ['tea', 'chiya'], fertilizer: 'Urea 250 kg/ha + DAP 120 kg/ha + MOP 150 kg/ha', yield: 14 },
  ginger: { aliases: ['ginger', 'aduwa'], fertilizer: 'Urea 80 kg/ha + DAP 60 kg/ha + MOP 50 kg/ha', yield: 130 },
  cardamom: { aliases: ['cardamom', 'alainchi', 'large cardamom'], fertilizer: 'Urea 100 kg/ha + DAP 50 kg/ha + MOP 60 kg/ha', yield: 3 },
  cauliflower: { aliases: ['cauliflower', 'kauli'], fertilizer: 'Urea 150 kg/ha + DAP 100 kg/ha + MOP 80 kg/ha', yield: 180 },
  tomato: { aliases: ['tomato', 'golbheda'], fertilizer: 'Urea 140 kg/ha + DAP 100 kg/ha + MOP 90 kg/ha', yield: 220 },
};

export function lookupCrop(name) {
  const key = String(name || '').toLowerCase().trim();
  for (const [crop, data] of Object.entries(NEPAL_CROPS)) {
    if (key === crop || data.aliases.includes(key)) return { crop, ...data };
  }
  return null;
}

const DISTRICT_CROPS = {
  morang: ['paddy', 'maize', 'potato', 'mustard', 'sugarcane'],
  sunsari: ['paddy', 'maize', 'potato', 'sugarcane', 'mustard'],
  jhapa: ['paddy', 'maize', 'potato', 'ginger', 'tea'],
  banke: ['paddy', 'wheat', 'maize', 'mustard', 'lentil'],
  bardiya: ['paddy', 'wheat', 'maize', 'sugarcane', 'lentil'],
  kailali: ['paddy', 'wheat', 'maize', 'sugarcane', 'mustard'],
  kanchanpur: ['paddy', 'wheat', 'maize', 'sugarcane', 'lentil'],
  chitwan: ['paddy', 'maize', 'wheat', 'mustard', 'cauliflower'],
  nawalparasi: ['paddy', 'maize', 'wheat', 'sugarcane', 'potato'],
  dhanusha: ['paddy', 'wheat', 'maize', 'mustard', 'lentil'],
  sarlahi: ['paddy', 'wheat', 'maize', 'potato', 'lentil'],
  sindhuli: ['paddy', 'maize', 'millet', 'ginger', 'cardamom'],
  kavrepalanchok: ['maize', 'millet', 'potato', 'buckwheat', 'cauliflower'],
  lalitpur: ['paddy', 'maize', 'millet', 'potato', 'cauliflower'],
  kathmandu: ['paddy', 'maize', 'potato', 'cauliflower', 'tomato'],
  'lamjung': ['paddy', 'maize', 'millet', 'ginger', 'potato'],
  kaski: ['paddy', 'maize', 'millet', 'ginger', 'potato'],
  syangja: ['paddy', 'maize', 'millet', 'ginger', 'potato'],
  myagdi: ['maize', 'millet', 'buckwheat', 'potato', 'ginger'],
  mustang: ['buckwheat', 'barley', 'potato', 'apple'],
  dolpa: ['barley', 'buckwheat', 'potato', 'millet'],
  jumla: ['barley', 'buckwheat', 'potato', 'apple'],
  illam: ['maize', 'millet', 'tea', 'cardamom', 'potato'],
  panchthar: ['maize', 'millet', 'tea', 'cardamom', 'ginger'],
  taplejung: ['maize', 'millet', 'cardamom', 'ginger', 'potato'],
  okhaldhunga: ['maize', 'millet', 'potato', 'ginger', 'cardamom'],
  baglung: ['maize', 'millet', 'potato', 'ginger', 'buckwheat'],
  parbat: ['maize', 'millet', 'potato', 'ginger', 'buckwheat'],
  rupandehi: ['paddy', 'wheat', 'maize', 'potato', 'mustard'],
  kapilbastu: ['paddy', 'wheat', 'maize', 'mustard', 'sugarcane'],
  palpa: ['paddy', 'maize', 'millet', 'ginger', 'potato'],
  bhaktapur: ['paddy', 'maize', 'potato', 'cauliflower', 'tomato'],
  dhankuta: ['maize', 'millet', 'ginger', 'cardamom', 'potato'],
  bhojpur: ['maize', 'millet', 'ginger', 'cardamom', 'potato'],
  khotang: ['maize', 'millet', 'ginger', 'cardamom', 'potato'],
  udayapur: ['paddy', 'maize', 'jute', 'mustard', 'potato'],
  rautahat: ['paddy', 'wheat', 'maize', 'mustard', 'lentil'],
  mahottari: ['paddy', 'wheat', 'maize', 'mustard', 'lentil'],
  saptari: ['paddy', 'wheat', 'maize', 'sugarcane', 'mustard'],
  siraha: ['paddy', 'wheat', 'maize', 'sugarcane', 'mustard'],
  bara: ['paddy', 'wheat', 'maize', 'mustard', 'sugarcane'],
  parsa: ['paddy', 'wheat', 'maize', 'mustard', 'sugarcane'],
  dhading: ['maize', 'millet', 'rice', 'ginger', 'tea'],
  makwanpur: ['paddy', 'maize', 'potato', 'mustard', 'sugarcane'],
  nuwakot: ['maize', 'millet', 'potato', 'ginger', 'mustard'],
  ramechhap: ['maize', 'millet', 'potato', 'ginger', 'cardamom'],
  rasuwa: ['barley', 'buckwheat', 'potato', 'millet', 'ginger'],
  sindhupalchok: ['maize', 'millet', 'potato', 'ginger', 'cardamom'],
  dolakha: ['maize', 'millet', 'potato', 'buckwheat', 'cardamom'],
  gorkha: ['maize', 'millet', 'rice', 'ginger', 'potato'],
  tanahun: ['paddy', 'maize', 'millet', 'ginger', 'potato'],
  manang: ['barley', 'buckwheat', 'potato', 'millet'],
  nawalpur: ['paddy', 'maize', 'wheat', 'sugarcane', 'potato'],
  'nawalparasi east': ['paddy', 'maize', 'wheat', 'sugarcane', 'potato'],
  'nawalparasi west': ['paddy', 'maize', 'wheat', 'sugarcane', 'potato'],
  arghakhanchi: ['maize', 'millet', 'rice', 'ginger', 'mustard'],
  gulmi: ['maize', 'millet', 'rice', 'ginger', 'tea'],
  pyuthan: ['maize', 'millet', 'rice', 'ginger', 'mustard'],
  rolpa: ['maize', 'millet', 'buckwheat', 'potato', 'mustard'],
  salyan: ['maize', 'millet', 'buckwheat', 'potato', 'mustard'],
  'rukum east': ['maize', 'millet', 'buckwheat', 'potato', 'ginger'],
  'rukum west': ['barley', 'buckwheat', 'millet', 'potato', 'maize'],
  mugu: ['barley', 'buckwheat', 'potato', 'millet'],
  sankhuwasabha: ['maize', 'millet', 'potato', 'cardamom', 'barley'],
  solukhumbu: ['barley', 'buckwheat', 'potato', 'cardamom', 'millet'],
  achham: ['maize', 'millet', 'rice', 'mustard', 'potato'],
  baitadi: ['maize', 'millet', 'buckwheat', 'potato', 'ginger'],
  bajhang: ['maize', 'millet', 'buckwheat', 'barley', 'potato'],
  bajura: ['barley', 'buckwheat', 'millet', 'potato'],
  dadeldhura: ['maize', 'millet', 'rice', 'ginger', 'mustard'],
  darchula: ['maize', 'millet', 'ginger', 'rice', 'potato'],
  doti: ['maize', 'millet', 'rice', 'mustard', 'potato'],
  jajarkot: ['barley', 'buckwheat', 'millet', 'potato', 'maize'],
  kalikot: ['barley', 'buckwheat', 'millet', 'potato', 'maize'],
  dailekh: ['maize', 'millet', 'buckwheat', 'potato', 'mustard'],
  humla: ['barley', 'buckwheat', 'millet', 'potato'],
};

const HILL_CROPS = ['maize', 'millet', 'potato', 'buckwheat', 'ginger'];
const TERAI_CROPS = ['paddy', 'maize', 'wheat', 'mustard', 'sugarcane'];
const MOUNTAIN_CROPS = ['barley', 'buckwheat', 'potato', 'millet'];

import {
  getViableCrops,
  validateAndFilterCrops,
  getZoneForDistrict,
  normalizeSeason as guardrailNormalizeSeason,
} from './guardrails.js';

export function normalizeSeason(season) {
  return guardrailNormalizeSeason(season);
}

export function regionOf(state, district) {
  return getZoneForDistrict(district || state || '');
}

/** Typical Nepal soil macronutrients (mg/kg) and moisture % by agro-ecological zone */
export const REGION_SOIL = {
  terai: { n: 45, p: 30, k: 35, moisture: 45 },
  hill: { n: 60, p: 40, k: 45, moisture: 40 },
  mountain: { n: 70, p: 50, k: 55, moisture: 35 },
};

/** Typical Nepal climate by agro-ecological zone */
export const REGION_CLIMATE = {
  terai: { t: 28, h: 70, rainfall: 1600, ph: 6.5 },
  hill: { t: 22, h: 75, rainfall: 2200, ph: 5.8 },
  mountain: { t: 13, h: 65, rainfall: 800, ph: 5.4 },
};

export async function offlineCropsFor(state, district, season, { allowOllama = false } = {}) {
  const loc = district || state || 'Nepal';
  const viable = getViableCrops(loc, season);
  if (allowOllama && isOllamaEnabled()) try {
    const text = await askOllama(
      `${OLLAMA_CONTEXT} Recommend 4-8 staple crops grown in ${loc}, Nepal during ${season}. VIABLE CANDIDATES: ${viable.join(', ')}. Reply with comma-separated list chosen strictly from candidates.`,
    );
    const validated = validateAndFilterCrops(text, loc, season);
    if (validated.validCrops.length) return validated.validCrops;
  } catch (err) {
    console.warn(`[nepalAgri] Ollama unavailable (${err.message || err}); using rule fallback.`);
  }
  const validated = validateAndFilterCrops(viable, loc, season);
  return validated.validCrops;
}

export async function offlineRecommendedCrop({ n, p, k, t, h, ph, r, season = 'Any', state = '', district = '' }, { allowOllama = false } = {}) {
  const loc = district || state || 'Nepal';
  const viable = getViableCrops(loc, season);
  if (allowOllama && isOllamaEnabled()) try {
    const text = await askOllama(
      `${OLLAMA_CONTEXT} Recommend 4-5 crops that will grow best in Nepal under the given conditions and season. VIABLE CANDIDATES: ${viable.join(', ')}. Reply with only a comma-separated list chosen strictly from candidates.`,
      `Season: ${season}; soil N=${n} mg/kg, P=${p} mg/kg, K=${k} mg/kg; temperature ${t} C; humidity ${h}%; soil pH ${ph}; rainfall ${r} mm/year.`,
    );
    const validated = validateAndFilterCrops(text, loc, season);
    if (validated.validCrops.length) return { crops: validated.validCrops, reason: `Best crops for these ${season.toLowerCase()} conditions (Ollama)` };
  } catch (err) {
    console.warn(`[nepalAgri] Ollama unavailable (${err.message || err}); using rule fallback.`);
  }

  const validated = validateAndFilterCrops(viable, loc, season);
  const region = regionOf(state || district, district || state);
  return {
    crops: validated.validCrops,
    reason: `Verified ${region} crops biologically suited for ${season} season in ${loc}`,
  };
}

export async function offlineFertilizer(cropName, { allowOllama = false } = {}) {
  if (allowOllama && isOllamaEnabled()) try {
    const text = await askOllama(
      `${OLLAMA_CONTEXT} Recommend exactly ONE fertilizer (common name used in Nepal) with a per-hectare rate for growing ${cropName}. Reply with only the fertilizer name and rate, e.g. "Urea 120 kg/ha" — no extra text.`,
    );
    const out = cleanAnswer(text).split('\n')[0].slice(0, 120);
    if (out) return out;
  } catch (err) {
    console.warn(`[nepalAgri] Ollama unavailable (${err.message || err}); using rule fallback.`);
  }
  const found = lookupCrop(cropName);
  return found ? found.fertilizer : 'Urea 80 kg/ha + DAP 50 kg/ha + MOP 30 kg/ha';
}

export async function offlineYield(cropName, area, { allowOllama = false } = {}) {
  if (allowOllama && isOllamaEnabled()) try {
    const text = await askOllama(
      `${OLLAMA_CONTEXT} Estimate the realistic crop yield in kg per hectare for ${cropName} grown in Nepal. Reply with only a number, no units.`,
    );
    const val = firstNumber(text);
    if (val) return Number((val * Number(area)).toFixed(1));
  } catch (err) {
    console.warn(`[nepalAgri] Ollama unavailable (${err.message || err}); using rule fallback.`);
  }
  const found = lookupCrop(cropName);
  const perHa = found ? found.yield : 25;
  return Number((perHa * Number(area)).toFixed(1));
}

const MONSOON_MM = {
  january: [8, 20, 30],
  february: [15, 30, 40],
  march: [20, 40, 50],
  april: [50, 80, 80],
  may: [120, 180, 130],
  june: [230, 300, 180],
  july: [420, 520, 250],
  august: [380, 460, 230],
  september: [220, 290, 160],
  october: [50, 80, 60],
  november: [10, 20, 25],
  december: [8, 15, 20],
};

export async function offlineRainfall(region, month, { allowOllama = false } = {}) {
  if (allowOllama && isOllamaEnabled()) try {
    const text = await askOllama(
      `${OLLAMA_CONTEXT} Estimate the typical total rainfall in millimetres for ${month} in the ${region} region of Nepal. Reply with only a number, no units.`,
    );
    const val = firstNumber(text);
    if (val != null) return val;
  } catch (err) {
    console.warn(`[nepalAgri] Ollama unavailable (${err.message || err}); using rule fallback.`);
  }
  const m = String(month).toLowerCase();
  const approx = Object.keys(MONSOON_MM).find((k) => k.startsWith(m.slice(0, 3))) || 'june';
  const r = String(region).toLowerCase();
  let idx = 0;
  if (/(terai|plain|morang|jhapa|banke)/.test(r)) idx = 0;
  else if (/(hill|mid|kathmandu|pokhara)/.test(r)) idx = 1;
  else idx = 2;
  return MONSOON_MM[approx][idx];
}
