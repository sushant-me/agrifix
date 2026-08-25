"""
AgriSmart Crop Guardrails & Hallucination Mitigation Module (Python)
--------------------------------------------------------------------
Provides:
1. Context Grounding (Pre-Processing): Filters viable crops by district, agro-ecological zone, and season.
2. Grounded Prompt Engineering: Constructs strict, bounded system and user prompts for LLMs.
3. Post-Generation Validation (Guardrails): Intercepts LLM outputs, validates against Nepal agricultural ground truth,
   drops hallucinated crops (e.g., winter ginger in Gorkha), and triggers retries if necessary.
"""

from typing import List, Dict, Tuple, Set, Optional, Union
import re
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# 1. Nepal Agro-Ecological Zones & District Classifications
# -----------------------------------------------------------------------------

AGRO_ZONES = {
    "mountain": {
        "districts": [
            "mustang", "dolpa", "jumla", "humla", "mugu", "kalikot", "manang",
            "rasuwa", "solukhumbu", "sankhuwasabha", "taplejung", "bajura",
            "darchula", "dolakha", "rukum west"
        ],
        "default_crops": ["barley", "buckwheat", "potato", "millet", "wheat", "pea", "cabbage"],
    },
    "terai": {
        "districts": [
            "jhapa", "morang", "sunsari", "saptari", "siraha", "dhanusha", "mahottari",
            "sarlahi", "rautahat", "bara", "parsa", "chitwan", "nawalpur",
            "nawalparasi east", "nawalparasi west", "rupandehi", "kapilvastu", "kapilbastu",
            "dang", "banke", "bardiya", "kailali", "kanchanpur", "udayapur"
        ],
        "default_crops": ["paddy", "wheat", "maize", "mustard", "sugarcane", "lentil", "potato", "chickpea", "jute"],
    },
    "hill": {
        "districts": [
            "kathmandu", "lalitpur", "bhaktapur", "kaski", "gorkha", "tanahun", "lamjung",
            "syangja", "parbat", "baglung", "myagdi", "dhading", "nuwakot", "kavrepalanchok",
            "sindhupalchok", "sindhuli", "makwanpur", "ramechhap", "okhaldhunga", "khotang",
            "bhojpur", "dhankuta", "terhathum", "panchthar", "ilam", "illam", "palpa",
            "gulmi", "arghakhanchi", "pyuthan", "rolpa", "rukum east", "salyan", "surkhet",
            "dailekh", "jajarkot", "achham", "doti", "dadeldhura", "baitadi", "bajhang"
        ],
        "default_crops": ["maize", "millet", "paddy", "wheat", "potato", "mustard", "ginger", "cardamom", "cauliflower", "tomato", "lentil", "buckwheat", "barley", "tea"],
    },
}

# -----------------------------------------------------------------------------
# 2. Biological Seasonal Suitability Rules for Nepal
# -----------------------------------------------------------------------------
# Defines what crops are biologically capable of growing/harvesting in each season per zone.

SEASON_CROP_MATRIX = {
    "winter": {  # Rabi / Winter (Poush - Falgun / Dec - Feb) - Cool, dry, frost in hills/mountains
        "terai": ["wheat", "mustard", "potato", "lentil", "chickpea", "barley", "pea", "sugarcane", "cauliflower", "cabbage", "radish"],
        "hill": ["wheat", "barley", "mustard", "potato", "lentil", "pea", "cauliflower", "cabbage", "radish", "buckwheat", "garlic", "onion"],
        "mountain": ["barley", "buckwheat", "wheat", "potato", "pea", "radish"],
    },
    "monsoon": {  # Kharif / Main Monsoon (Asar - Bhadra / Jun - Aug) - Warm, heavy rainfall
        "terai": ["paddy", "rice", "maize", "sugarcane", "jute", "sesame", "soybean", "groundnut", "turmeric"],
        "hill": ["paddy", "rice", "maize", "millet", "ginger", "soybean", "potato", "cardamom", "tea", "turmeric", "cucumber", "pumpkin"],
        "mountain": ["potato", "buckwheat", "barley", "millet", "maize", "mustard"],
    },
    "summer": {  # Pre-Monsoon / Summer (Chaitra - Jestha / Mar - May) - Warm to hot, rising temperatures
        "terai": ["maize", "mung bean", "cucumber", "pumpkin", "tomato", "vegetables", "sunflower", "spring paddy", "watermelon"],
        "hill": ["maize", "ginger", "tomato", "millet", "cucumber", "pumpkin", "vegetables", "capsicum", "french bean", "potato"],
        "mountain": ["potato", "buckwheat", "barley", "spinach", "pea", "vegetables"],
    },
    "autumn": {  # Post-Monsoon / Autumn (Ashoj - Kartik / Sep - Nov) - Mild temperatures, harvesting monsoon crops & sowing winter crops
        "terai": ["cauliflower", "cabbage", "potato", "mustard", "radish", "paddy", "sugarcane", "brinjal", "tomato"],
        "hill": ["cauliflower", "cabbage", "potato", "mustard", "radish", "cardamom", "maize", "ginger", "millet", "peas"],
        "mountain": ["buckwheat", "barley", "potato", "cabbage", "cauliflower"],
    },
    "spring": {  # Spring (Falgun - Baisakh / Feb - Apr)
        "terai": ["maize", "mung bean", "sunflower", "vegetables", "cucumber", "tomato", "sugarcane"],
        "hill": ["maize", "potato", "ginger", "tomato", "cucumber", "capsicum", "tea"],
        "mountain": ["barley", "buckwheat", "potato", "pea"],
    },
}

# Explicitly prohibited crop-season combinations (strictly biologically impossible / severe hallucinations)
PROHIBITED_COMBINATIONS = {
    "winter": {
        "all": ["ginger", "paddy", "rice", "jute", "watermelon", "cucumber"],
        "hill": ["ginger", "paddy", "rice", "maize", "millet", "jute", "sugarcane"],
        "mountain": ["ginger", "paddy", "rice", "maize", "sugarcane", "tomato", "jute", "tea"],
    },
    "monsoon": {
        "all": ["mustard", "wheat", "barley", "chickpea"],
    }
}

# Crop Aliases for Normalization
CROP_ALIASES = {
    "rice": "paddy",
    "dhan": "paddy",
    "paddy rice": "paddy",
    "corn": "maize",
    "makai": "maize",
    "gahun": "wheat",
    "kodo": "millet",
    "finger millet": "millet",
    "jau": "barley",
    "fapar": "buckwheat",
    "phapar": "buckwheat",
    "alu": "potato",
    "aloo": "potato",
    "tori": "mustard",
    "sarson": "mustard",
    "rayo": "mustard",
    "ukhu": "sugarcane",
    "masuro": "lentil",
    "masur": "lentil",
    "chana": "chickpea",
    "gram": "chickpea",
    "chiya": "tea",
    "aduwa": "ginger",
    "alainchi": "cardamom",
    "large cardamom": "cardamom",
    "kauli": "cauliflower",
    "gobi": "cabbage",
    "bandagobi": "cabbage",
    "golbheda": "tomato",
    "tamatar": "tomato",
    "kerau": "pea",
    "matar": "pea",
    "mula": "radish",
    "bhatmas": "soybean",
}


def normalize_crop_name(name: str) -> str:
    """Normalize crop name to lower-case canonical form."""
    clean = re.sub(r"[^a-zA-Z\s-]", "", str(name or "")).strip().lower()
    return CROP_ALIASES.get(clean, clean)


def normalize_season(season_str: str) -> str:
    """Normalize season input to one of standard keys: winter, monsoon, summer, autumn, spring."""
    s = str(season_str or "").lower().strip()
    if re.search(r"(winter|rabi|poush|magh|falgun|cool|cold|december|january|february)", s):
        return "winter"
    if re.search(r"(monsoon|kharif|asar|ashad|shrawan|bhadra|barsha|july|august)", s):
        return "monsoon"
    if re.search(r"(summer|chaitra|baishak|baisakh|jeth|jestha|may|june)", s):
        return "summer"
    if re.search(r"(autumn|post.?monsoon|ashoj|asoj|kartik|mangsir|september|october|november)", s):
        return "autumn"
    if re.search(r"(spring|pre.?monsoon|march|april)", s):
        return "spring"
    return "monsoon"  # safe default


def get_zone_for_district(district: str) -> str:
    """Lookup agro-ecological zone (mountain, terai, hill) for a Nepal district."""
    d = str(district or "").lower().strip()
    for zone, data in AGRO_ZONES.items():
        if d in data["districts"]:
            return zone
    # Partial matching
    for zone, data in AGRO_ZONES.items():
        if any(dist in d or d in dist for dist in data["districts"]):
            return zone
    return "hill"  # default Nepal mid-hills


# -----------------------------------------------------------------------------
# 3. Pre-Processing: Context Grounding
# -----------------------------------------------------------------------------

def get_viable_crops(district: str, season: str) -> List[str]:
    """
    PRE-PROCESSING LAYER (Context Grounding):
    Cross-references the agro-ecological zone of the district with the specified season
    to generate the strictly allowed, biologically viable crop list.
    """
    zone = get_zone_for_district(district)
    norm_season = normalize_season(season)

    # Base viable crops from matrix
    season_data = SEASON_CROP_MATRIX.get(norm_season, SEASON_CROP_MATRIX["monsoon"])
    viable_crops = season_data.get(zone, season_data.get("hill", [])).copy()

    # Apply strict exclusions
    prohibited = PROHIBITED_COMBINATIONS.get(norm_season, {})
    all_prohibited = set(prohibited.get("all", []) + prohibited.get(zone, []))

    filtered = [crop for crop in viable_crops if crop not in all_prohibited]
    return list(dict.fromkeys(filtered))  # preserve order, unique


def get_viable_context(district: str, season: str, soil_weather_data: Optional[Dict] = None) -> Dict:
    """
    Constructs the pre-filtered context dictionary ready to be injected into the LLM context.
    """
    zone = get_zone_for_district(district)
    norm_season = normalize_season(season)
    viable_crops = get_viable_crops(district, season)

    return {
        "district": district.capitalize(),
        "zone": zone.capitalize(),
        "season": season,
        "normalized_season": norm_season,
        "viable_crops": [c.capitalize() for c in viable_crops],
        "soil_weather": soil_weather_data or {},
    }


# -----------------------------------------------------------------------------
# 4. Strict Prompt Engineering
# -----------------------------------------------------------------------------

SYSTEM_PROMPT_TEMPLATE = """You are a Senior Agricultural Scientist and Agronomist for Nepal (Ministry of Agriculture and Livestock Development / DOA standards).
Your responsibility is to provide accurate, biologically sound, and locally verified crop recommendations for farmers in Nepal.

CRITICAL CONSTRAINTS & GUARDRAILS:
1. STRICT CONTEXT BOUNDARY: You must ONLY recommend crops from the provided "VIABLE_CANDIDATE_CROPS" list for the given district and season.
2. NO SEASONAL OR GEOGRAPHIC HALLUCINATIONS:
   - NEVER recommend warm-season or frost-sensitive crops (such as Ginger, Paddy/Rice, Maize) during Winter or Rabi in Hilly or Mountain districts (like Gorkha, Kathmandu, Solukhumbu).
   - NEVER recommend lowland tropical crops for alpine mountain zones.
3. OUTPUT FORMAT: Reply ONLY with a comma-separated list of 3 to 6 recommended crops chosen strictly from the allowed candidate pool, followed by a one-sentence agronomic rationale. Format:
CROPS: <Crop1>, <Crop2>, <Crop3>
RATIONALE: <Short one-sentence explanation>
Do not include any other commentary, disclaimers, or unverified crop names."""


def build_grounded_prompt(district: str, season: str, soil_weather_data: Optional[Dict] = None) -> Tuple[str, str]:
    """
    Builds the system prompt and grounded user prompt enforcing strict boundaries.
    """
    context = get_viable_context(district, season, soil_weather_data)
    viable_crops_str = ", ".join(context["viable_crops"])

    user_prompt = f"""Location: {context['district']} (Agro-Ecological Zone: {context['zone']})
Season: {season} (Category: {context['normalized_season'].capitalize()})
VIABLE_CANDIDATE_CROPS (Ground Truth Constraints): [{viable_crops_str}]"""

    if soil_weather_data:
        user_prompt += f"\nSoil & Weather Conditions: {json.dumps(soil_weather_data)}"

    user_prompt += f"\n\nTask: Select 3 to 6 best suited crops from VIABLE_CANDIDATE_CROPS for {context['district']} in {season}. Follow the required output format exactly."

    return SYSTEM_PROMPT_TEMPLATE, user_prompt


# -----------------------------------------------------------------------------
# 5. Post-Generation Validation (Guardrails)
# -----------------------------------------------------------------------------

def parse_llm_output(llm_text: str) -> List[str]:
    """Extract recommended crop names from raw LLM output."""
    if not llm_text:
        return []

    text = str(llm_text).strip()

    # Case 1: Format "CROPS: Wheat, Mustard, Potato"
    crops_match = re.search(r"CROPS:\s*([^\n\r]+)", text, re.IGNORECASE)
    if crops_match:
        raw_list = crops_match.group(1).split(",")
        return [c.strip() for c in raw_list if c.strip()]

    # Case 2: JSON array or JSON object
    if text.startswith("{") or text.startswith("["):
        try:
            data = json.loads(text)
            if isinstance(data, list):
                return [str(x).strip() for x in data]
            if isinstance(data, dict):
                candidates = data.get("crops") or data.get("recommendations") or []
                if isinstance(candidates, list):
                    return [str(x).strip() for x in candidates]
        except Exception:
            pass

    # Case 3: Comma or newline separated items
    lines = text.split("\n")
    first_meaningful = ""
    for line in lines:
        cleaned = re.sub(r"^(RATIONALE|EXPLANATION|NOTE):.*$", "", line, flags=re.IGNORECASE).strip()
        if cleaned:
            first_meaningful = cleaned
            break

    items = re.split(r"[,;•\n\d+\.]+", first_meaningful or text)
    return [i.strip() for i in items if i.strip() and len(i.strip()) > 1]


def validate_and_filter_crops(
    llm_output_or_crops: Union[str, List[str]],
    district: str,
    season: str
) -> Dict:
    """
    POST-GENERATION VALIDATION LAYER (Guardrails):
    Intercepts LLM crop suggestions, cross-references each against the definitive
    biological ground truth for {district, season}, drops hallucinations,
    and returns sanitized recommendations or signals a retry.
    """
    if isinstance(llm_output_or_crops, list):
        suggested_raw = llm_output_or_crops
    else:
        suggested_raw = parse_llm_output(llm_output_or_crops)

    viable_crops = get_viable_crops(district, season)
    viable_set = {c.lower() for c in viable_crops}

    norm_season = normalize_season(season)
    zone = get_zone_for_district(district)
    prohibited = PROHIBITED_COMBINATIONS.get(norm_season, {})
    strict_prohibited = set(prohibited.get("all", []) + prohibited.get(zone, []))

    valid_crops = []
    hallucinated_crops = []

    for raw_crop in suggested_raw:
        normalized = normalize_crop_name(raw_crop)
        if not normalized:
            continue

        # Check if explicitly prohibited (severe hallucination)
        if normalized in strict_prohibited:
            hallucinated_crops.append(raw_crop)
            logger.warning(
                f"[GUARDRAIL TRIGGERED] Dropped prohibited crop '{raw_crop}' ({normalized}) for {district} in {season}."
            )
            continue

        # Check if present in viable set
        if normalized in viable_set or any(v in normalized or normalized in v for v in viable_set):
            # Keep original casing formatted nicely
            canonical = normalized.capitalize()
            if canonical not in valid_crops:
                valid_crops.append(canonical)
        else:
            hallucinated_crops.append(raw_crop)
            logger.warning(
                f"[GUARDRAIL TRIGGERED] Dropped unverified/out-of-zone crop '{raw_crop}' for {district} in {season}."
            )

    # Determine status & action
    if len(valid_crops) >= 3:
        status = "passed"
        retry_required = False
    elif len(valid_crops) >= 1:
        status = "filtered"
        # Supplement with valid fallback crops to guarantee safe, complete recommendations
        for v in viable_crops:
            cap = v.capitalize()
            if cap not in valid_crops:
                valid_crops.append(cap)
            if len(valid_crops) >= 4:
                break
        retry_required = False
    else:
        status = "rejected"
        retry_required = True
        # Populate with pure ground-truth fallback
        valid_crops = [c.capitalize() for c in viable_crops[:5]]

    return {
        "valid_crops": valid_crops,
        "hallucinated_crops": hallucinated_crops,
        "status": status,
        "retry_required": retry_required,
        "district": district,
        "season": season,
        "agro_zone": zone,
        "message": f"Verified crop recommendations for {district} in {season}: {', '.join(valid_crops)}"
    }


# -----------------------------------------------------------------------------
# 6. Simulated LLM Pipeline with Guardrail & Retry Layer
# -----------------------------------------------------------------------------

def generate_crop_recommendation_with_guardrails(
    district: str,
    season: str,
    llm_callable=None,
    max_retries: int = 2
) -> Dict:
    """
    End-to-end robust pipeline with Context Grounding, Prompt Construction,
    LLM Inference, Post-Generation Validation, and Feedback-Driven Retry.
    """
    sys_prompt, user_prompt = build_grounded_prompt(district, season)

    # If no custom LLM callable provided, use safe deterministic generation
    if llm_callable is None:
        viable = get_viable_crops(district, season)
        simulated_output = f"CROPS: {', '.join([c.capitalize() for c in viable[:4]])}\nRATIONALE: Optimal crops for local climate."
        return validate_and_filter_crops(simulated_output, district, season)

    current_user_prompt = user_prompt
    for attempt in range(max_retries + 1):
        try:
            raw_response = llm_callable(sys_prompt, current_user_prompt)
            result = validate_and_filter_crops(raw_response, district, season)

            if not result["retry_required"] and not result["hallucinated_crops"]:
                return result

            if attempt < max_retries and result["hallucinated_crops"]:
                logger.info(f"Attempt {attempt + 1} produced hallucinations {result['hallucinated_crops']}. Retrying with feedback...")
                current_user_prompt = (
                    f"{user_prompt}\n\nCORRECTION: In your previous attempt you hallucinated invalid crops: {result['hallucinated_crops']}. "
                    f"Do NOT recommend these. Select ONLY from VIABLE_CANDIDATE_CROPS."
                )
                continue

            return result
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            break

    # Fallback to verified ground truth
    return validate_and_filter_crops("", district, season)


# -----------------------------------------------------------------------------
# 7. Verification Test Suite
# -----------------------------------------------------------------------------

def run_tests():
    """Runs automated verification tests for the guardrails."""
    print("=" * 70)
    print("RUNNING AGRISMART CROP GUARDRAILS VERIFICATION SUITE")
    print("=" * 70)

    # Test 1: Pre-Processing for Gorkha in Winter
    viable_gorkha_winter = get_viable_crops("Gorkha", "Winter")
    print(f"\n[Test 1] Viable crops for Gorkha (Hill) in Winter:")
    print(f"  Viable list: {viable_gorkha_winter}")
    assert "ginger" not in viable_gorkha_winter, "FAIL: Ginger should NOT be viable in Gorkha in Winter!"
    assert "paddy" not in viable_gorkha_winter, "FAIL: Paddy should NOT be viable in Gorkha in Winter!"
    assert "wheat" in viable_gorkha_winter, "FAIL: Wheat should be viable in Gorkha in Winter!"
    assert "mustard" in viable_gorkha_winter, "FAIL: Mustard should be viable in Gorkha in Winter!"
    print("  >>> PASS: Pre-processing correctly excludes Ginger/Paddy and includes Wheat/Mustard.")

    # Test 2: Post-Generation Validation Interception (Catch & Drop Hallucination)
    simulated_hallucination = "CROPS: Ginger, Wheat, Paddy, Mustard, Maize\nRATIONALE: Recommended based on soil nutrients."
    validation_res = validate_and_filter_crops(simulated_hallucination, "Gorkha", "Winter")
    print(f"\n[Test 2] Intercepting Hallucinated LLM Output:")
    print(f"  Input text: {simulated_hallucination.splitlines()[0]}")
    print(f"  Valid crops output: {validation_res['valid_crops']}")
    print(f"  Dropped hallucinations: {validation_res['hallucinated_crops']}")
    assert "Ginger" in validation_res["hallucinated_crops"] or "ginger" in [h.lower() for h in validation_res["hallucinated_crops"]], "FAIL: Ginger was not caught as hallucination!"
    assert "Ginger" not in validation_res["valid_crops"], "FAIL: Ginger leaked into valid crops!"
    assert "Wheat" in validation_res["valid_crops"], "FAIL: Wheat was dropped incorrectly!"
    print("  >>> PASS: Post-generation guardrail intercepted and dropped Winter Ginger & Paddy.")

    # Test 3: Total Hallucination Rejection & Ground Truth Recovery
    total_hallucination = "CROPS: Ginger, Banana, Mango, Paddy"
    total_val = validate_and_filter_crops(total_hallucination, "Gorkha", "Winter")
    print(f"\n[Test 3] Handling Complete Hallucination Output:")
    print(f"  Input text: {total_hallucination}")
    print(f"  Status: {total_val['status']}")
    print(f"  Recovered safe crops: {total_val['valid_crops']}")
    assert "Ginger" not in total_val["valid_crops"]
    assert len(total_val["valid_crops"]) >= 3
    print("  >>> PASS: Rejection and ground-truth recovery working as expected.")

    # Test 4: Terai in Monsoon (Should allow Paddy, Jute, Sugarcane)
    terai_monsoon = get_viable_crops("Jhapa", "Monsoon")
    print(f"\n[Test 4] Viable crops for Jhapa (Terai) in Monsoon:")
    print(f"  Viable list: {terai_monsoon}")
    assert "paddy" in terai_monsoon or "rice" in terai_monsoon
    assert "wheat" not in terai_monsoon, "FAIL: Wheat is a winter crop, not monsoon!"
    print("  >>> PASS: Terai monsoon crop profile matches agricultural science.")

    print("\n" + "=" * 70)
    print("ALL 4 TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    import sys
    if "--test" in sys.argv or len(sys.argv) == 1:
        run_tests()
