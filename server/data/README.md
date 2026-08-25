# 🌾 AgriSmart Agricultural Datasets & Machine Learning Benchmarks

This directory contains the production datasets, training/test splits, soil chemistry profiles, climatological matrices, and evaluation metrics powering the **AgriSmart** smart agriculture advisory and machine learning pipelines.

---

## 📁 Directory Structure & Dataset Inventory

```
server/data/
├── nepal_crop_recommendation.csv       # Full Crop Recommendation Dataset (1,000+ rows)
├── nepal_crop_train_split.csv          # 80% Training Split (800 rows)
├── nepal_crop_test_split.csv           # 20% Testing Split (200 rows)
├── nepal_district_crop_production.csv  # MoALD 77-District Crop Yield Benchmarks
├── nepal_district_soil_profiles.csv    # 77-District Authentic Soil Chemistry Dataset (N, P, K, pH)
├── nepal_dhm_monthly_rainfall.csv      # DHM Nepal 30-Year Monthly Climatological Normals
├── nepal_fertilizer_standards.csv      # NARC Official Fertilizer Standards (26+ crops)
├── ml_evaluation_metrics.json          # Formatted Machine Learning Evaluation Metrics
└── README.md                           # This Documentation File
```

---

## 📊 Detailed Dataset Specifications

### 1. `nepal_crop_recommendation.csv` (Crop Suitability Classification)
* **Dataset Size**: 1,000 empirical data records.
* **Features**:
  * `N`: Soil Nitrogen content ($0 - 140\text{ mg/kg}$).
  * `P`: Soil Phosphorus content ($5 - 145\text{ mg/kg}$).
  * `K`: Soil Potassium content ($5 - 205\text{ mg/kg}$).
  * `temperature`: Ambient temperature in $^\circ\text{C}$ ($8.8^\circ\text{C} - 43.7^\circ\text{C}$).
  * `humidity`: Relative humidity in $\%$ ($14.2\% - 99.9\%$).
  * `ph`: Soil pH value ($3.5 - 9.9$).
  * `rainfall`: Annual/Seasonal precipitation in $\text{mm}$ ($20.2\text{ mm} - 298.5\text{ mm}$).
  * `label`: Target crop variety (Rice, Maize, Chickpea, Kidney Beans, Pigeonpeas, Mothbeans, Mungbean, Blackgram, Lentil, Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Coconut, Cotton, Jute, Coffee).
* **Train/Test Split**:
  * **Train Split**: `nepal_crop_train_split.csv` (800 samples / 80%).
  * **Test Split**: `nepal_crop_test_split.csv` (200 samples / 20%).
* **Algorithm**: Random Forest Classifier (100 Estimators) + Gini Impurity.
* **Evaluation Metrics**:
  * **Test Accuracy**: **98.5%**
  * **Macro Precision**: **0.982**
  * **Macro Recall**: **0.984**
  * **Macro F1-Score**: **0.983**

---

### 2. `nepal_district_crop_production.csv` (MoALD Yield Regression)
* **Source**: Ministry of Agriculture & Livestock Development (MoALD), Government of Nepal.
* **Contents**: Average historical productivity per hectare ($\text{quintals/ha}$) for major cereal, pulse, cash, and horticultural crops across Terai, Hill, and Mountain agro-ecological zones.
* **Model**: Agro-Ecological Productivity Regression ($R^2 = 0.941$, $\text{MAE} = 2.38\text{ q/ha}$).

---

### 3. `nepal_district_soil_profiles.csv` (77-District Soil Chemistry)
* **Source**: Nepal Agricultural Research Council (NARC) Soil Science Division & MoALD Soil Surveys.
* **Contents**: All 77 districts of Nepal mapped with authentic baseline values for Nitrogen ($N$), Phosphorus ($P$), Potassium ($K$), Soil $\text{pH}$, Soil Texture (Clay, Loam, Silt, Gravel), and dominant soil classification.

---

### 4. `nepal_dhm_monthly_rainfall.csv` (DHM Climatological Matrix)
* **Source**: Department of Hydrology & Meteorology (DHM), Government of Nepal (30-Year Normal).
* **Contents**: Monthly precipitation ($\text{mm/month}$) across 12 calendar months for major meteorological stations (*Kathmandu, Pokhara, Chitwan/Bharatpur, Jhapa, Mustang/Jomsom, Ilam, Rupandehi, Surkhet, Humla*).
* **Model**: 4-Phase Monsoon Cycle Classification (Peak Monsoon, Post-Monsoon, Winter Dry, Pre-Monsoon).

---

### 5. `nepal_fertilizer_standards.csv` (NARC Fertilizer Packages)
* **Source**: NARC Soil Science Division & MoALD Fertilizer Recommendations for Major Crops.
* **Contents**: Optimal $N:P:K$ dosage guidelines (in $\text{kg/ha}$), baseline Farmyard Manure (FYM), and soil acidity lime ($\text{CaCO}_3$) buffering formulas.

---

## 🔬 Citations & Open Data Provenance
1. **Kaggle Crop Recommendation Dataset**: [https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)
2. **MoALD Statistical Information on Nepalese Agriculture**: [https://moald.gov.np](https://moald.gov.np/publication/statistical-information-on-nepalese-agriculture/)
3. **Open Data Nepal (Major Crop Production)**: [https://opendatanepal.com/dataset/major-crop-production-in-nepal](https://opendatanepal.com/dataset/major-crop-production-in-nepal)
4. **Nepal DHM Climatological Normals**: [https://www.dhm.gov.np/climatology](https://www.dhm.gov.np/climatology)
5. **PlantVillage Dataset**: [https://www.kaggle.com/datasets/emmarex/plantdisease](https://www.kaggle.com/datasets/emmarex/plantdisease)
