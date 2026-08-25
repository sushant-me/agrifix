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
   "Nawalparasi East",
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

const SEASON_TEMPLATES = {
  terai: {
    'Kharif': ['Rice', 'Maize', 'Sugarcane', 'Sesame', 'Groundnut', 'Soybean'],
    'Rabi': ['Wheat', 'Potato', 'Mustard', 'Lentil', 'Chickpea', 'Rice'],
    'Summer': ['Cucumber', 'Pumpkin', 'Mung Bean', 'Rice', 'Tomato', 'Vegetables'],
    'Autumn': ['Cauliflower', 'Cabbage', 'Potato', 'Rice', 'Sugarcane', 'Mustard'],
    'Winter': ['Wheat', 'Potato', 'Barley', 'Pea', 'Mustard', 'Lentil'],
    'Whole Year': ['Banana', 'Sugarcane', 'Rice', 'Maize', 'Turmeric', 'Wheat'],
  },
  hill: {
    'Kharif': ['Maize', 'Millet', 'Rice', 'Ginger', 'Mustard', 'Soybean'],
    'Rabi': ['Wheat', 'Potato', 'Barley', 'Maize', 'Lentil', 'Mustard'],
    'Summer': ['Maize', 'Millet', 'Tomato', 'Pumpkin', 'Cucumber', 'Ginger'],
    'Autumn': ['Cabbage', 'Cauliflower', 'Maize', 'Millet', 'Potato', 'Mustard'],
    'Winter': ['Wheat', 'Potato', 'Barley', 'Maize', 'Lentil', 'Pea'],
    'Whole Year': ['Ginger', 'Cardamom', 'Maize', 'Millet', 'Potato', 'Turmeric'],
  },
  mountain: {
    'Kharif': ['Barley', 'Buckwheat', 'Millet', 'Potato', 'Maize', 'Mustard'],
    'Rabi': ['Barley', 'Buckwheat', 'Wheat', 'Millet', 'Potato', 'Lentil'],
    'Summer': ['Buckwheat', 'Millet', 'Potato', 'Tomato', 'Cucumber', 'Vegetables'],
    'Autumn': ['Buckwheat', 'Barley', 'Cauliflower', 'Cabbage', 'Potato', 'Millet'],
    'Winter': ['Barley', 'Buckwheat', 'Wheat', 'Millet', 'Potato', 'Lentil'],
    'Whole Year': ['Barley', 'Buckwheat', 'Millet', 'Potato', 'Ginger', 'Cardamom'],
  },
};

const GENERATED_DISTRICT_CONFIG = {
  'Panchthar': { zone: 'hill', extra: ['Tea', 'Cardamom'] },
  'Taplejung': { zone: 'mountain', extra: ['Cardamom', 'Ginger'] },
  'Sankhuwasabha': { zone: 'mountain', extra: ['Cardamom', 'Potato'] },
  'Solukhumbu': { zone: 'mountain', extra: ['Cardamom', 'Ginger'] },
  'Terhathum': { zone: 'hill', extra: ['Tea', 'Cardamom'] },
  'Khotang': { zone: 'hill', extra: ['Cardamom', 'Ginger'] },
  'Okhaldhunga': { zone: 'hill', extra: ['Cardamom', 'Ginger'] },
  'Udayapur': { zone: 'terai', extra: ['Groundnut', 'Sesame'] },
  'Rautahat': { zone: 'terai', extra: ['Groundnut', 'Sesame'] },
  'Sarlahi': { zone: 'terai', extra: ['Groundnut', 'Chickpea'] },
  'Dhading': { zone: 'hill', extra: ['Tea', 'Cardamom'] },
  'Makwanpur': { zone: 'hill', extra: ['Sugarcane', 'Turmeric'] },
  'Nuwakot': { zone: 'hill', extra: ['Ginger', 'Tea'] },
  'Ramechhap': { zone: 'hill', extra: ['Cardamom', 'Ginger'] },
  'Rasuwa': { zone: 'mountain', extra: ['Ginger', 'Tea'] },
  'Sindhupalchok': { zone: 'hill', extra: ['Ginger', 'Cardamom'] },
  'Dolakha': { zone: 'mountain', extra: ['Ginger', 'Cardamom'] },
  'Manang': { zone: 'mountain', extra: [] },
  'Mustang': { zone: 'mountain', extra: [] },
  'Myagdi': { zone: 'hill', extra: ['Ginger', 'Cardamom'] },
  'Nawalpur': { zone: 'terai', extra: ['Banana', 'Potato'] },
  'Parbat': { zone: 'hill', extra: ['Ginger', 'Buckwheat'] },
  'Arghakhanchi': { zone: 'hill', extra: ['Ginger', 'Lentil'] },
  'Gulmi': { zone: 'hill', extra: ['Ginger', 'Tea'] },
  'Palpa': { zone: 'hill', extra: ['Tea', 'Ginger'] },
  'Pyuthan': { zone: 'hill', extra: ['Ginger', 'Maize'] },
  'Rolpa': { zone: 'hill', extra: ['Buckwheat', 'Millet'] },
  'Rukum East': { zone: 'hill', extra: ['Buckwheat', 'Millet'] },
  'Nawalparasi East': { zone: 'terai', extra: ['Banana', 'Sugarcane'] },
  'Dolpa': { zone: 'mountain', extra: [] },
  'Mugu': { zone: 'mountain', extra: [] },
  'Salyan': { zone: 'hill', extra: ['Buckwheat', 'Millet'] },
  'Rukum West': { zone: 'mountain', extra: [] },
  'Baitadi': { zone: 'hill', extra: ['Ginger', 'Buckwheat'] },
  'Bajura': { zone: 'mountain', extra: [] },
  'Darchula': { zone: 'hill', extra: ['Ginger', 'Tea'] },
};

function buildZoneCrops(config) {
  const base = SEASON_TEMPLATES[config.zone] || SEASON_TEMPLATES.hill;
  const out = {};
  for (const [season, list] of Object.entries(base)) {
    const merged = [...list.slice(0, 4), ...config.extra];
    out[season] = [...new Set(merged)].slice(0, 6);
  }
  return out;
}

const GENERATED_DISTRICTS = Object.fromEntries(
  Object.entries(GENERATED_DISTRICT_CONFIG).map(([name, cfg]) => [name, buildZoneCrops(cfg)])
);
export const CROPS_BY_DISTRICT = {
 "Jhapa": {
  "Kharif": [
   "Ginger",
   "Groundnut",
   "Lentil",
   "Millet",
   "Tea",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Cardamom",
   "Chickpea",
   "Ginger",
   "Lentil",
   "Maize"
  ],
  "Summer": [
   "Cardamom",
   "Cucumber",
   "Ginger",
   "Mung Bean",
   "Pumpkin",
   "Tea"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Ginger",
   "Maize",
   "Potato",
   "Tea"
  ],
  "Winter": [
   "Barley",
   "Cardamom",
   "Ginger",
   "Maize",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Ginger",
   "Maize",
   "Sugarcane",
   "Tea",
   "Turmeric"
  ]
 },
 "Morang": {
  "Kharif": [
   "Groundnut",
   "Millet",
   "Sesame",
   "Soybean",
   "Tea",
   "Wheat"
  ],
  "Rabi": [
   "Chickpea",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Tea"
  ],
  "Summer": [
   "Cardamom",
   "Cucumber",
   "Ginger",
   "Mung Bean",
   "Pumpkin",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cardamom",
   "Ginger",
   "Maize",
   "Mustard",
   "Tea"
  ],
  "Winter": [
   "Cardamom",
   "Lentil",
   "Pea",
   "Potato",
   "Rice",
   "Tea"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Maize",
   "Rice",
   "Sugarcane",
   "Turmeric"
  ]
 },
 "Sunsari": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Maize",
   "Mustard",
   "Soybean",
   "Wheat"
  ],
  "Rabi": [
   "Chickpea",
   "Ginger",
   "Mustard",
   "Rice",
   "Tea",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Ginger",
   "Mung Bean",
   "Pumpkin",
   "Tea",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cardamom",
   "Cauliflower",
   "Mustard",
   "Potato",
   "Tea"
  ],
  "Winter": [
   "Cardamom",
   "Lentil",
   "Pea",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Rice",
   "Sugarcane",
   "Tea",
   "Turmeric"
  ]
 },
 "Ilam": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Maize",
   "Sesame",
   "Soybean",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Maize",
   "Rice",
   "Tea",
   "Wheat"
  ],
  "Summer": [
   "Cardamom",
   "Ginger",
   "Maize",
   "Mung Bean",
   "Rice",
   "Tea"
  ],
  "Autumn": [
   "Cabbage",
   "Cardamom",
   "Maize",
   "Mustard",
   "Potato",
   "Tea"
  ],
  "Winter": [
   "Barley",
   "Ginger",
   "Lentil",
   "Rice",
   "Tea",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Maize",
   "Rice",
   "Sugarcane",
   "Turmeric"
  ]
 },
 "Dhankuta": {
  "Kharif": [
   "Cardamom",
   "Ginger",
   "Millet",
   "Mustard",
   "Sesame",
   "Wheat"
  ],
  "Rabi": [
   "Cardamom",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Cardamom",
   "Ginger",
   "Maize",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Ginger",
   "Maize",
   "Mustard",
   "Tea"
  ],
  "Winter": [
   "Cardamom",
   "Ginger",
   "Lentil",
   "Maize",
   "Tea",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Maize",
   "Sugarcane",
   "Tea",
   "Turmeric"
  ]
 },
 "Bhojpur": {
  "Kharif": [
   "Cardamom",
   "Groundnut",
   "Lentil",
   "Maize",
   "Sesame",
   "Tea"
  ],
  "Rabi": [
   "Barley",
   "Cardamom",
   "Chickpea",
   "Ginger",
   "Maize",
   "Tea"
  ],
  "Summer": [
   "Cardamom",
   "Cucumber",
   "Ginger",
   "Mung Bean",
   "Pumpkin",
   "Tomato"
  ],
  "Autumn": [
   "Cardamom",
   "Cauliflower",
   "Ginger",
   "Mustard",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Barley",
   "Cardamom",
   "Ginger",
   "Lentil",
   "Rice",
   "Tea"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Maize",
   "Rice",
   "Sugarcane",
   "Tea"
  ]
 },
 "Saptari": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Millet",
   "Mustard",
   "Rice",
   "Sesame"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Summer": [
   "Lentil",
   "Mung Bean",
   "Pumpkin",
   "Sugarcane",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Lentil",
   "Mustard",
   "Pea",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Ginger",
   "Lentil",
   "Mustard",
   "Sugarcane",
   "Wheat"
  ]
 },
 "Siraha": {
  "Kharif": [
   "Groundnut",
   "Millet",
   "Mustard",
   "Sesame",
   "Soybean",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Summer": [
   "Maize",
   "Mung Bean",
   "Mustard",
   "Pumpkin",
   "Rice",
   "Vegetables"
  ],
  "Autumn": [
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Lentil",
   "Mustard",
   "Rice",
   "Tea",
   "Turmeric"
  ]
 },
 "Dhanusha": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Millet",
   "Mustard",
   "Rice",
   "Soybean"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Mustard",
   "Potato",
   "Sugarcane",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Lentil",
   "Maize",
   "Pumpkin",
   "Sugarcane",
   "Tomato"
  ],
  "Autumn": [
   "Cauliflower",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Winter": [
   "Barley",
   "Mustard",
   "Pea",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Whole Year": [
   "Ginger",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Tea",
   "Wheat"
  ]
 },
 "Mahottari": {
  "Kharif": [
   "Lentil",
   "Maize",
   "Millet",
   "Mustard",
   "Soybean",
   "Sugarcane"
  ],
  "Rabi": [
   "Barley",
   "Maize",
   "Potato",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Summer": [
   "Lentil",
   "Mung Bean",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Autumn": [
   "Cauliflower",
   "Lentil",
   "Mustard",
   "Potato",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Lentil",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Ginger",
   "Sugarcane",
   "Tea",
   "Wheat"
  ]
 },
 "Bara": {
  "Kharif": [
   "Groundnut",
   "Millet",
   "Rice",
   "Sesame",
   "Soybean",
   "Sugarcane"
  ],
  "Rabi": [
   "Chickpea",
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Maize",
   "Mung Bean",
   "Mustard",
   "Sugarcane",
   "Vegetables"
  ],
  "Autumn": [
   "Cauliflower",
   "Lentil",
   "Potato",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Lentil",
   "Mustard",
   "Pea",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Lentil",
   "Mustard",
   "Sugarcane",
   "Tea",
   "Turmeric"
  ]
 },
 "Parsa": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Rice",
   "Sesame",
   "Soybean",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Mustard",
   "Potato",
   "Sugarcane",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Lentil",
   "Mung Bean",
   "Sugarcane",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Lentil",
   "Potato",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Whole Year": [
   "Cardamom",
   "Ginger",
   "Lentil",
   "Rice",
   "Sugarcane",
   "Turmeric"
  ]
 },
 "Kathmandu": {
  "Kharif": [
   "Lentil",
   "Mustard",
   "Potato",
   "Soybean",
   "Tomato",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Maize",
   "Potato",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Summer": [
   "Cucumber",
   "Maize",
   "Potato",
   "Pumpkin",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Maize",
   "Mustard",
   "Tomato",
   "Vegetables"
  ],
  "Winter": [
   "Lentil",
   "Potato",
   "Rice",
   "Tomato",
   "Vegetables",
   "Wheat"
  ],
  "Whole Year": [
   "Ginger",
   "Maize",
   "Potato",
   "Rice",
   "Sugarcane",
   "Turmeric"
  ]
 },
 "Lalitpur": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Millet",
   "Mustard",
   "Sesame",
   "Vegetables"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Mustard",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Summer": [
   "Mung Bean",
   "Potato",
   "Pumpkin",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Maize",
   "Mustard",
   "Potato",
   "Tomato",
   "Vegetables"
  ],
  "Winter": [
   "Barley",
   "Maize",
   "Pea",
   "Potato",
   "Vegetables",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Ginger",
   "Tea",
   "Tomato",
   "Turmeric",
   "Vegetables"
  ]
 },
 "Bhaktapur": {
  "Kharif": [
   "Lentil",
   "Maize",
   "Millet",
   "Potato",
   "Soybean",
   "Vegetables"
  ],
  "Rabi": [
   "Lentil",
   "Maize",
   "Potato",
   "Tomato",
   "Vegetables",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Maize",
   "Potato",
   "Pumpkin",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Maize",
   "Mustard",
   "Potato",
   "Rice",
   "Vegetables"
  ],
  "Winter": [
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Whole Year": [
   "Banana",
   "Maize",
   "Rice",
   "Tea",
   "Turmeric",
   "Vegetables"
  ]
 },
 "Chitwan": {
  "Kharif": [
   "Maize",
   "Millet",
   "Potato",
   "Rice",
   "Sesame",
   "Soybean"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Potato",
   "Pumpkin",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Maize",
   "Mustard",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Barley",
   "Pea",
   "Rice",
   "Tomato",
   "Vegetables",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Potato",
   "Rice",
   "Sugarcane",
   "Turmeric",
   "Vegetables"
  ]
 },
 "Kavrepalanchok": {
  "Kharif": [
   "Lentil",
   "Maize",
   "Millet",
   "Potato",
   "Sesame",
   "Tomato"
  ],
  "Rabi": [
   "Chickpea",
   "Lentil",
   "Maize",
   "Potato",
   "Tomato",
   "Vegetables"
  ],
  "Summer": [
   "Cucumber",
   "Maize",
   "Potato",
   "Pumpkin",
   "Rice",
   "Tomato"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Maize",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Winter": [
   "Barley",
   "Pea",
   "Potato",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Whole Year": [
   "Cardamom",
   "Maize",
   "Potato",
   "Rice",
   "Tea",
   "Tomato"
  ]
 },
 "Sindhuli": {
  "Kharif": [
   "Maize",
   "Millet",
   "Mustard",
   "Potato",
   "Sesame",
   "Tomato"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Mustard",
   "Potato",
   "Tomato",
   "Vegetables"
  ],
  "Summer": [
   "Cucumber",
   "Maize",
   "Potato",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cauliflower",
   "Maize",
   "Mustard",
   "Potato",
   "Rice",
   "Tomato"
  ],
  "Winter": [
   "Barley",
   "Maize",
   "Pea",
   "Potato",
   "Vegetables",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Ginger",
   "Maize",
   "Potato",
   "Sugarcane",
   "Tomato"
  ]
 },
 "Kaski": {
  "Kharif": [
   "Ginger",
   "Groundnut",
   "Lentil",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Ginger",
   "Lentil",
   "Maize",
   "Rice"
  ],
  "Summer": [
   "Maize",
   "Millet",
   "Potato",
   "Pumpkin",
   "Tomato",
   "Wheat"
  ],
  "Autumn": [
   "Cauliflower",
   "Ginger",
   "Maize",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Ginger",
   "Lentil",
   "Maize",
   "Pea",
   "Potato"
  ],
  "Whole Year": [
   "Ginger",
   "Maize",
   "Millet",
   "Potato",
   "Tea",
   "Wheat"
  ]
 },
 "Lamjung": {
  "Kharif": [
   "Ginger",
   "Millet",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Maize",
   "Millet",
   "Mustard",
   "Potato"
  ],
  "Summer": [
   "Ginger",
   "Millet",
   "Potato",
   "Pumpkin",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Ginger",
   "Maize",
   "Potato",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Ginger",
   "Lentil",
   "Maize",
   "Millet",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Millet",
   "Potato",
   "Tea",
   "Turmeric",
   "Wheat"
  ]
 },
 "Gorkha": {
  "Kharif": [
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Ginger",
   "Millet",
   "Potato",
   "Rice"
  ],
  "Summer": [
   "Maize",
   "Millet",
   "Mung Bean",
   "Potato",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Ginger",
   "Maize",
   "Millet",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Barley",
   "Ginger",
   "Lentil",
   "Maize",
   "Pea",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Ginger",
   "Sugarcane",
   "Tea",
   "Turmeric"
  ]
 },
 "Tanahun": {
  "Kharif": [
   "Groundnut",
   "Millet",
   "Mustard",
   "Potato",
   "Rice",
   "Sesame"
  ],
  "Rabi": [
   "Ginger",
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Maize",
   "Millet",
   "Pumpkin",
   "Tomato",
   "Vegetables",
   "Wheat"
  ],
  "Autumn": [
   "Cabbage",
   "Ginger",
   "Maize",
   "Millet",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Ginger",
   "Lentil",
   "Maize",
   "Millet",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Cardamom",
   "Ginger",
   "Millet",
   "Sugarcane",
   "Tea",
   "Turmeric"
  ]
 },
 "Syangja": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Soybean"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice"
  ],
  "Summer": [
   "Cucumber",
   "Ginger",
   "Potato",
   "Pumpkin",
   "Tomato",
   "Wheat"
  ],
  "Autumn": [
   "Cabbage",
   "Ginger",
   "Maize",
   "Millet",
   "Mustard",
   "Potato"
  ],
  "Winter": [
   "Barley",
   "Ginger",
   "Lentil",
   "Maize",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Millet",
   "Potato",
   "Sugarcane",
   "Turmeric",
   "Wheat"
  ]
 },
 "Baglung": {
  "Kharif": [
   "Groundnut",
   "Maize",
   "Mustard",
   "Potato",
   "Rice",
   "Soybean"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Millet",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Maize",
   "Mung Bean",
   "Potato",
   "Vegetables",
   "Wheat"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Maize",
   "Millet",
   "Mustard",
   "Potato"
  ],
  "Winter": [
   "Ginger",
   "Maize",
   "Millet",
   "Pea",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Ginger",
   "Maize",
   "Millet",
   "Potato"
  ]
 },
 "Rupandehi": {
  "Kharif": [
   "Banana",
   "Millet",
   "Rice",
   "Sesame",
   "Soybean",
   "Sugarcane"
  ],
  "Rabi": [
   "Banana",
   "Barley",
   "Chickpea",
   "Lentil",
   "Potato",
   "Rice"
  ],
  "Summer": [
   "Cucumber",
   "Mung Bean",
   "Mustard",
   "Rice",
   "Tomato",
   "Wheat"
  ],
  "Autumn": [
   "Banana",
   "Cabbage",
   "Mustard",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Winter": [
   "Banana",
   "Barley",
   "Lentil",
   "Pea",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Mustard",
   "Sugarcane",
   "Tea",
   "Wheat"
  ]
 },
 "Kapilvastu": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Maize",
   "Sesame",
   "Soybean",
   "Sugarcane"
  ],
  "Rabi": [
   "Banana",
   "Barley",
   "Lentil",
   "Maize",
   "Mustard",
   "Potato"
  ],
  "Summer": [
   "Mung Bean",
   "Mustard",
   "Pumpkin",
   "Sugarcane",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Banana",
   "Cabbage",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Mustard",
   "Pea",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Tea"
  ]
 },
 "Nawalparasi West": {
  "Kharif": [
   "Banana",
   "Groundnut",
   "Lentil",
   "Maize",
   "Millet",
   "Sugarcane"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Summer": [
   "Cucumber",
   "Mustard",
   "Pumpkin",
   "Sugarcane",
   "Vegetables",
   "Wheat"
  ],
  "Autumn": [
   "Banana",
   "Cauliflower",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Lentil",
   "Mustard",
   "Pea",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Whole Year": [
   "Banana",
   "Ginger",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ]
 },
 "Dang": {
  "Kharif": [
   "Banana",
   "Maize",
   "Millet",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Rabi": [
   "Banana",
   "Chickpea",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Mung Bean",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Tomato",
   "Wheat"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Mustard",
   "Potato",
   "Rice",
   "Sugarcane"
  ],
  "Winter": [
   "Banana",
   "Lentil",
   "Mustard",
   "Pea",
   "Sugarcane",
   "Wheat"
  ],
  "Whole Year": [
   "Cardamom",
   "Ginger",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Tea"
  ]
 },
 "Banke": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Millet",
   "Sesame",
   "Soybean",
   "Sugarcane"
  ],
  "Rabi": [
   "Banana",
   "Lentil",
   "Maize",
   "Mustard",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Banana",
   "Maize",
   "Mung Bean",
   "Pumpkin",
   "Rice",
   "Sugarcane"
  ],
  "Autumn": [
   "Banana",
   "Cabbage",
   "Cauliflower",
   "Potato",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Banana",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Mustard",
   "Sugarcane",
   "Tea",
   "Turmeric",
   "Wheat"
  ]
 },
 "Bardiya": {
  "Kharif": [
   "Banana",
   "Groundnut",
   "Maize",
   "Millet",
   "Sesame",
   "Sugarcane"
  ],
  "Rabi": [
   "Banana",
   "Barley",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Summer": [
   "Banana",
   "Mung Bean",
   "Pumpkin",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Autumn": [
   "Banana",
   "Cabbage",
   "Potato",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Winter": [
   "Mustard",
   "Pea",
   "Potato",
   "Rice",
   "Sugarcane",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Mustard",
   "Rice",
   "Turmeric",
   "Wheat"
  ]
 },
 "Surkhet": {
  "Kharif": [
   "Barley",
   "Buckwheat",
   "Groundnut",
   "Millet",
   "Mustard",
   "Soybean"
  ],
  "Rabi": [
   "Buckwheat",
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Summer": [
   "Buckwheat",
   "Cucumber",
   "Lentil",
   "Millet",
   "Potato",
   "Tomato"
  ],
  "Autumn": [
   "Buckwheat",
   "Cabbage",
   "Cauliflower",
   "Millet",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Buckwheat",
   "Lentil",
   "Millet",
   "Pea",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Buckwheat",
   "Ginger",
   "Lentil",
   "Potato",
   "Tea"
  ]
 },
 "Dailekh": {
  "Kharif": [
   "Barley",
   "Groundnut",
   "Millet",
   "Mustard",
   "Potato",
   "Soybean"
  ],
  "Rabi": [
   "Barley",
   "Buckwheat",
   "Chickpea",
   "Maize",
   "Potato",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Lentil",
   "Maize",
   "Potato",
   "Pumpkin",
   "Vegetables"
  ],
  "Autumn": [
   "Barley",
   "Buckwheat",
   "Cabbage",
   "Lentil",
   "Millet",
   "Potato"
  ],
  "Winter": [
   "Barley",
   "Buckwheat",
   "Lentil",
   "Pea",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Cardamom",
   "Lentil",
   "Potato",
   "Sugarcane",
   "Tea",
   "Turmeric"
  ]
 },
 "Jumla": {
  "Kharif": [
   "Buckwheat",
   "Groundnut",
   "Millet",
   "Mustard",
   "Potato",
   "Rice"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Lentil",
   "Maize",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Lentil",
   "Millet",
   "Mung Bean",
   "Potato",
   "Tomato"
  ],
  "Autumn": [
   "Cabbage",
   "Lentil",
   "Millet",
   "Mustard",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Barley",
   "Buckwheat",
   "Lentil",
   "Millet",
   "Pea",
   "Potato"
  ],
  "Whole Year": [
   "Barley",
   "Buckwheat",
   "Ginger",
   "Millet",
   "Potato",
   "Tea"
  ]
 },
 "Kalikot": {
  "Kharif": [
   "Buckwheat",
   "Groundnut",
   "Maize",
   "Mustard",
   "Rice",
   "Sesame"
  ],
  "Rabi": [
   "Barley",
   "Buckwheat",
   "Chickpea",
   "Maize",
   "Mustard",
   "Potato"
  ],
  "Summer": [
   "Cucumber",
   "Lentil",
   "Maize",
   "Mung Bean",
   "Pumpkin",
   "Vegetables"
  ],
  "Autumn": [
   "Barley",
   "Buckwheat",
   "Cauliflower",
   "Lentil",
   "Mustard",
   "Potato"
  ],
  "Winter": [
   "Barley",
   "Buckwheat",
   "Lentil",
   "Millet",
   "Pea",
   "Potato"
  ],
  "Whole Year": [
   "Buckwheat",
   "Cardamom",
   "Lentil",
   "Millet",
   "Potato",
   "Tea"
  ]
 },
 "Jajarkot": {
  "Kharif": [
   "Barley",
   "Buckwheat",
   "Groundnut",
   "Maize",
   "Mustard",
   "Potato"
  ],
  "Rabi": [
   "Buckwheat",
   "Lentil",
   "Millet",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Summer": [
   "Barley",
   "Lentil",
   "Millet",
   "Potato",
   "Pumpkin",
   "Vegetables"
  ],
  "Autumn": [
   "Buckwheat",
   "Cauliflower",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Barley",
   "Buckwheat",
   "Millet",
   "Pea",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Buckwheat",
   "Ginger",
   "Lentil",
   "Potato",
   "Tea"
  ]
 },
 "Humla": {
  "Kharif": [
   "Barley",
   "Buckwheat",
   "Lentil",
   "Maize",
   "Millet",
   "Potato"
  ],
  "Rabi": [
   "Buckwheat",
   "Maize",
   "Millet",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Barley",
   "Buckwheat",
   "Lentil",
   "Millet",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Barley",
   "Buckwheat",
   "Cauliflower",
   "Lentil",
   "Potato",
   "Rice"
  ],
  "Winter": [
   "Barley",
   "Buckwheat",
   "Lentil",
   "Pea",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Barley",
   "Buckwheat",
   "Cardamom",
   "Lentil",
   "Sugarcane",
   "Turmeric"
  ]
 },
 "Kailali": {
  "Kharif": [
   "Lentil",
   "Maize",
   "Mustard",
   "Rice",
   "Sesame",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Lentil",
   "Maize",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Mung Bean",
   "Mustard",
   "Pumpkin",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Maize",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Maize",
   "Mustard",
   "Pea",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Ginger",
   "Lentil",
   "Maize",
   "Mustard"
  ]
 },
 "Kanchanpur": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Millet",
   "Sesame",
   "Soybean",
   "Wheat"
  ],
  "Rabi": [
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Lentil",
   "Mustard",
   "Pumpkin",
   "Tomato",
   "Vegetables",
   "Wheat"
  ],
  "Autumn": [
   "Cabbage",
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Whole Year": [
   "Banana",
   "Cardamom",
   "Ginger",
   "Mustard",
   "Tea",
   "Wheat"
  ]
 },
 "Doti": {
  "Kharif": [
   "Lentil",
   "Millet",
   "Mustard",
   "Rice",
   "Sesame",
   "Wheat"
  ],
  "Rabi": [
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Lentil",
   "Maize",
   "Mustard",
   "Rice",
   "Wheat"
  ],
  "Autumn": [
   "Cauliflower",
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Winter": [
   "Lentil",
   "Mustard",
   "Pea",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Ginger",
   "Lentil",
   "Maize",
   "Mustard",
   "Rice",
   "Wheat"
  ]
 },
 "Achham": {
  "Kharif": [
   "Lentil",
   "Maize",
   "Millet",
   "Mustard",
   "Sesame",
   "Soybean"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Rice"
  ],
  "Summer": [
   "Maize",
   "Mustard",
   "Pumpkin",
   "Rice",
   "Vegetables",
   "Wheat"
  ],
  "Autumn": [
   "Cauliflower",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Cardamom",
   "Lentil",
   "Maize",
   "Mustard",
   "Sugarcane",
   "Wheat"
  ]
 },
 "Bajhang": {
  "Kharif": [
   "Groundnut",
   "Lentil",
   "Maize",
   "Millet",
   "Soybean",
   "Wheat"
  ],
  "Rabi": [
   "Barley",
   "Lentil",
   "Maize",
   "Mustard",
   "Potato",
   "Wheat"
  ],
  "Summer": [
   "Cucumber",
   "Lentil",
   "Maize",
   "Rice",
   "Tomato",
   "Vegetables"
  ],
  "Autumn": [
   "Cabbage",
   "Cauliflower",
   "Lentil",
   "Maize",
   "Mustard",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Maize",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Cardamom",
   "Rice",
   "Sugarcane",
   "Tea",
   "Turmeric",
   "Wheat"
  ]
 },
 "Dadeldhura": {
  "Kharif": [
   "Groundnut",
   "Maize",
   "Millet",
   "Mustard",
   "Sesame",
   "Soybean"
  ],
  "Rabi": [
   "Barley",
   "Chickpea",
   "Lentil",
   "Maize",
   "Mustard",
   "Potato"
  ],
  "Summer": [
   "Cucumber",
   "Maize",
   "Mustard",
   "Rice",
   "Vegetables",
   "Wheat"
  ],
  "Autumn": [
   "Cabbage",
   "Lentil",
   "Mustard",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Winter": [
   "Barley",
   "Lentil",
   "Maize",
   "Potato",
   "Rice",
   "Wheat"
  ],
  "Whole Year": [
   "Cardamom",
   "Ginger",
   "Mustard",
   "Rice",
   "Sugarcane",
   "Wheat"
  ]
 },
 ...GENERATED_DISTRICTS
};
export const REGIONS = [
 "Terai",
 "Hill",
 "Mountain"
];
export const MONTHS = [
 "January", "February", "March", "April", "May", "June",
 "July", "August", "September", "October", "November", "December"
];
