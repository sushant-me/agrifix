// Nepal province/district/season data — all 7 provinces and all 77 districts.
export const PROVINCES = [
 {
  "name": "Koshi Province",
  "districts": [
   "Bhojpur",
   "Dhankuta",
   "Ilam",
   "Jhapa",
   "Khotang",
   "Morang",
   "Okhaldhunga",
   "Panchthar",
   "Sankhuwasabha",
   "Solukhumbu",
   "Sunsari",
   "Taplejung",
   "Terhathum",
   "Udayapur"
  ]
 },
 {
  "name": "Madhesh Province",
  "districts": [
   "Bara",
   "Dhanusha",
   "Mahottari",
   "Parsa",
   "Rautahat",
   "Saptari",
   "Siraha",
   "Sarlahi"
  ]
 },
 {
  "name": "Bagmati Province",
  "districts": [
   "Bhaktapur",
   "Chitwan",
   "Dhading",
   "Dolakha",
   "Kathmandu",
   "Kavrepalanchok",
   "Lalitpur",
   "Makwanpur",
   "Nuwakot",
   "Ramechhap",
   "Rasuwa",
   "Sindhuli",
   "Sindhupalchok"
  ]
 },
 {
  "name": "Gandaki Province",
  "districts": [
   "Baglung",
   "Gorkha",
   "Kaski",
   "Lamjung",
   "Manang",
   "Mustang",
   "Myagdi",
   "Nawalpur",
   "Parbat",
   "Syangja",
   "Tanahun"
  ]
 },
 {
  "name": "Lumbini Province",
  "districts": [
   "Arghakhanchi",
   "Banke",
   "Bardiya",
   "Dang",
   "Gulmi",
   "Kapilvastu",
   "Nawalparasi West",
   "Palpa",
   "Pyuthan",
   "Rolpa",
   "Rukum East",
   "Rupandehi"
  ]
 },
 {
  "name": "Karnali Province",
  "districts": [
   "Dailekh",
   "Dolpa",
   "Humla",
   "Jajarkot",
   "Jumla",
   "Kalikot",
   "Mugu",
   "Salyan",
   "Surkhet",
   "Rukum West"
  ]
 },
 {
  "name": "Sudurpashchim Province",
  "districts": [
   "Achham",
   "Baitadi",
   "Bajhang",
   "Bajura",
   "Dadeldhura",
   "Darchula",
   "Doti",
   "Kailali",
   "Kanchanpur"
  ]
 }
];

export const DISTRICT_ZONES = {
  // Mountain
  'Mustang': 'mountain', 'Dolpa': 'mountain', 'Jumla': 'mountain', 'Humla': 'mountain',
  'Mugu': 'mountain', 'Kalikot': 'mountain', 'Manang': 'mountain', 'Rasuwa': 'mountain',
  'Solukhumbu': 'mountain', 'Sankhuwasabha': 'mountain', 'Taplejung': 'mountain',
  'Bajura': 'mountain', 'Darchula': 'mountain', 'Dolakha': 'mountain', 'Rukum West': 'mountain',

  // Terai
  'Jhapa': 'terai', 'Morang': 'terai', 'Sunsari': 'terai', 'Saptari': 'terai',
  'Siraha': 'terai', 'Dhanusha': 'terai', 'Mahottari': 'terai', 'Sarlahi': 'terai',
  'Rautahat': 'terai', 'Bara': 'terai', 'Parsa': 'terai', 'Chitwan': 'terai',
  'Nawalpur': 'terai', 'Nawalparasi East': 'terai', 'Nawalparasi West': 'terai',
  'Rupandehi': 'terai', 'Kapilvastu': 'terai', 'Dang': 'terai', 'Banke': 'terai',
  'Bardiya': 'terai', 'Kailali': 'terai', 'Kanchanpur': 'terai', 'Udayapur': 'terai',

  // Hill (all other districts default to hill)
};

export const DISTRICT_SPECIALTIES = {
  'Jhapa': { kharif: ['Tea'], summer: ['Mung Bean'] },
  'Ilam': { kharif: ['Tea', 'Cardamom'], wholeYear: ['Tea', 'Cardamom'] },
  'Panchthar': { kharif: ['Tea', 'Cardamom'], wholeYear: ['Tea', 'Cardamom'] },
  'Dhankuta': { kharif: ['Cardamom', 'Ginger'], summer: ['Tomato'] },
  'Gorkha': { kharif: ['Ginger', 'Millet'], summer: ['Ginger', 'Tomato'] },
  'Kaski': { kharif: ['Ginger', 'Millet'], summer: ['Cucumber', 'Tomato'] },
  'Chitwan': { kharif: ['Maize', 'Sesame'], winter: ['Mustard', 'Cauliflower'] },
  'Mustang': { winter: ['Buckwheat', 'Barley'], wholeYear: ['Apple', 'Buckwheat'] },
  'Jumla': { winter: ['Buckwheat', 'Barley'], wholeYear: ['Apple', 'Buckwheat'] },
  'Kathmandu': { autumn: ['Cauliflower', 'Cabbage'], summer: ['Tomato'] },
  'Bhaktapur': { autumn: ['Cauliflower', 'Cabbage'], summer: ['Tomato'] },
  'Lalitpur': { autumn: ['Cauliflower', 'Cabbage'], summer: ['Tomato'] },
};

const SEASON_TEMPLATES = {
  terai: {
    'Kharif': ['Rice', 'Maize', 'Sugarcane', 'Sesame', 'Groundnut', 'Soybean'],
    'Rabi': ['Wheat', 'Potato', 'Mustard', 'Lentil', 'Chickpea', 'Barley'],
    'Summer': ['Cucumber', 'Pumpkin', 'Mung Bean', 'Tomato', 'Vegetables', 'Maize'],
    'Autumn': ['Cauliflower', 'Cabbage', 'Potato', 'Rice', 'Sugarcane', 'Mustard'],
    'Winter': ['Wheat', 'Potato', 'Mustard', 'Lentil', 'Chickpea', 'Pea'],
    'Whole Year': ['Banana', 'Sugarcane', 'Turmeric', 'Potato', 'Maize', 'Wheat'],
  },
  hill: {
    'Kharif': ['Maize', 'Millet', 'Rice', 'Ginger', 'Potato', 'Soybean'],
    'Rabi': ['Wheat', 'Potato', 'Barley', 'Mustard', 'Lentil', 'Pea'],
    'Summer': ['Maize', 'Millet', 'Tomato', 'Cucumber', 'Pumpkin', 'Ginger'],
    'Autumn': ['Cabbage', 'Cauliflower', 'Maize', 'Potato', 'Mustard', 'Radish'],
    'Winter': ['Wheat', 'Potato', 'Barley', 'Mustard', 'Lentil', 'Pea'],
    'Whole Year': ['Cardamom', 'Tea', 'Potato', 'Millet', 'Maize', 'Turmeric'],
  },
  mountain: {
    'Kharif': ['Barley', 'Buckwheat', 'Millet', 'Potato', 'Maize', 'Mustard'],
    'Rabi': ['Barley', 'Buckwheat', 'Wheat', 'Potato', 'Pea', 'Lentil'],
    'Summer': ['Buckwheat', 'Millet', 'Potato', 'Tomato', 'Cucumber', 'Vegetables'],
    'Autumn': ['Buckwheat', 'Barley', 'Cauliflower', 'Cabbage', 'Potato', 'Radish'],
    'Winter': ['Barley', 'Buckwheat', 'Wheat', 'Potato', 'Pea', 'Radish'],
    'Whole Year': ['Barley', 'Buckwheat', 'Potato', 'Apple', 'Millet', 'Cardamom'],
  },
};

// Prohibited crop per season (guardrail to guarantee biological correctness)
const PROHIBITED_IN_SEASON = {
  'Winter': ['Ginger', 'Rice', 'Paddy', 'Jute', 'Watermelon', 'Cucumber', 'Banana'],
  'Rabi': ['Ginger', 'Rice', 'Paddy', 'Jute', 'Watermelon'],
  'Kharif': ['Wheat', 'Mustard', 'Barley', 'Chickpea'],
};

function buildDistrictCrops(districtName) {
  const zone = DISTRICT_ZONES[districtName] || 'hill';
  const base = SEASON_TEMPLATES[zone] || SEASON_TEMPLATES.hill;
  const specialties = DISTRICT_SPECIALTIES[districtName] || {};

  const districtData = {};
  for (const [season, defaultList] of Object.entries(base)) {
    const seasonKey = season.toLowerCase();
    const extra = specialties[seasonKey] || [];
    const merged = [...defaultList, ...extra];

    const prohibited = new Set(PROHIBITED_IN_SEASON[season] || []);
    const filtered = merged.filter((c) => !prohibited.has(c));

    districtData[season] = [...new Set(filtered)].slice(0, 6);
  }
  return districtData;
}

const allDistrictNames = PROVINCES.flatMap((p) => p.districts);

export const CROPS_BY_DISTRICT = Object.fromEntries(
  allDistrictNames.map((name) => [name, buildDistrictCrops(name)])
);

if (CROPS_BY_DISTRICT['Nawalpur']) {
  CROPS_BY_DISTRICT['Nawalparasi East'] = CROPS_BY_DISTRICT['Nawalpur'];
}
if (CROPS_BY_DISTRICT['Ilam']) {
  CROPS_BY_DISTRICT['Illam'] = CROPS_BY_DISTRICT['Ilam'];
}

export const REGIONS = [
  "Terai",
  "Hill",
  "Mountain"
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
