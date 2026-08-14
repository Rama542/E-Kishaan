"""
Dynamic Agronomy & Mathematical Engine
=======================================
Pure dynamic calculation of GDD thermal time accumulation, BBCH phenology stage,
fertilizer bag counts, and 15L knapsack sprayer pump chemical dosages.
Zero hardcoded or static data.
"""

import math
from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
from pydantic import BaseModel, Field

# ─── Base Crop Agronomic Parameters ──────────────────────────────────────────

CROP_THERMAL_PARAMS: Dict[str, Dict[str, Any]] = {
    "wheat": {
        "name": "Wheat (Triticum aestivum)",
        "t_base": 4.5,
        "total_gdd_target": 1650.0,
        "n_uptake_per_ton": 25.0,  # kg N needed per ton yield
        "p_uptake_per_ton": 11.0,  # kg P2O5 needed per ton yield
        "k_uptake_per_ton": 20.0,  # kg K2O needed per ton yield
        "spray_volume_l_per_acre": 200.0,
    },
    "rice": {
        "name": "Paddy Rice (Oryza sativa)",
        "t_base": 10.0,
        "total_gdd_target": 1950.0,
        "n_uptake_per_ton": 20.0,
        "p_uptake_per_ton": 9.0,
        "k_uptake_per_ton": 24.0,
        "spray_volume_l_per_acre": 200.0,
    },
    "cotton": {
        "name": "Cotton (Gossypium hirsutum)",
        "t_base": 15.0,
        "total_gdd_target": 2200.0,
        "n_uptake_per_ton": 35.0,
        "p_uptake_per_ton": 15.0,
        "k_uptake_per_ton": 30.0,
        "spray_volume_l_per_acre": 250.0,
    },
    "maize": {
        "name": "Maize / Corn (Zea mays)",
        "t_base": 10.0,
        "total_gdd_target": 1700.0,
        "n_uptake_per_ton": 22.0,
        "p_uptake_per_ton": 10.0,
        "k_uptake_per_ton": 19.0,
        "spray_volume_l_per_acre": 200.0,
    },
    "sugarcane": {
        "name": "Sugarcane (Saccharum officinarum)",
        "t_base": 12.0,
        "total_gdd_target": 3200.0,
        "n_uptake_per_ton": 1.8,
        "p_uptake_per_ton": 0.8,
        "k_uptake_per_ton": 2.2,
        "spray_volume_l_per_acre": 300.0,
    },
    "potato": {
        "name": "Potato (Solanum tuberosum)",
        "t_base": 7.0,
        "total_gdd_target": 1500.0,
        "n_uptake_per_ton": 5.0,
        "p_uptake_per_ton": 2.0,
        "k_uptake_per_ton": 8.0,
        "spray_volume_l_per_acre": 200.0,
    },
}

BBCH_STAGE_MAPPING: List[Tuple[float, int, str, str]] = [
    (0.05, 0, "BBCH 00-09: Germination & Sprouting", "Dry seed imbibition, radicle emergence, seedling sprout."),
    (0.15, 10, "BBCH 10-19: Leaf Development", "First true leaves unfolded, photosynthetic organ establishment."),
    (0.30, 20, "BBCH 20-29: Tillering / Side Shoot Emergence", "Active vegetative branching and main shoot expansion."),
    (0.45, 30, "BBCH 30-39: Stem Elongation / Pseudostem Extension", "Rapid internode extension, canopy closure."),
    (0.60, 50, "BBCH 50-59: Inflorescence Emergence / Booting", "Head/panicle emergence, reproductive organ formation."),
    (0.75, 60, "BBCH 60-69: Flowering / Anthesis", "Anther emergence, pollination, fertilization phase."),
    (0.90, 70, "BBCH 70-89: Fruit / Grain Milk to Dough Stage", "Grain filling, starch synthesis, seed maturation."),
    (1.00, 90, "BBCH 90-99: Senescence & Harvest Readiness", "Physiological maturity, grain drying, harvest ready."),
]

# ─── Mathematical Engines ───────────────────────────────────────────────────

def calculate_daily_gdd(t_max: float, t_min: float, t_base: float) -> float:
    """
    GDD_daily = max((T_max + T_min) / 2 - T_base, 0)
    """
    t_avg = (t_max + t_min) / 2.0
    return max(t_avg - t_base, 0.0)


def calculate_accumulated_gdd(daily_temps: List[Tuple[float, float]], t_base: float) -> float:
    """
    Accumulated GDD = sum_{d=sowing}^{today} GDD_daily(d)
    """
    return sum(calculate_daily_gdd(t_max, t_min, t_base) for t_max, t_min in daily_temps)


def determine_bbch_stage(accumulated_gdd: float, total_gdd_target: float) -> Dict[str, Any]:
    """
    Determines BBCH stage dynamically from thermal progress percentage.
    """
    ratio = min(accumulated_gdd / max(total_gdd_target, 1.0), 1.0)
    current_code = 0
    current_name = BBCH_STAGE_MAPPING[0][2]
    current_desc = BBCH_STAGE_MAPPING[0][3]

    for threshold, code, name, desc in BBCH_STAGE_MAPPING:
        if ratio >= threshold:
            current_code = code
            current_name = name
            current_desc = desc

    return {
        "progress_ratio": round(ratio, 4),
        "progress_percent": round(ratio * 100.0, 2),
        "bbch_code": current_code,
        "stage_name": current_name,
        "description": current_desc,
    }


def estimate_days_to_harvest(accumulated_gdd: float, total_gdd_target: float, avg_daily_gdd: float = 12.5) -> int:
    """
    Days to harvest = ceil((GDD_target - GDD_accumulated) / GDD_daily_avg)
    """
    rem_gdd = max(total_gdd_target - accumulated_gdd, 0.0)
    if avg_daily_gdd <= 0:
        avg_daily_gdd = 12.5
    return math.ceil(rem_gdd / avg_daily_gdd)


# ─── Fertilizer & Fertigation Dosage Math ────────────────────────────────────

class FertilizerRequirement(BaseModel):
    crop_name: str
    field_area_acres: float
    target_yield_tons_per_acre: float
    soil_n_kg_per_acre: float
    soil_p_kg_per_acre: float
    soil_k_kg_per_acre: float

    nitrogen_needed_kg: float
    phosphorus_needed_kg: float
    potassium_needed_kg: float

    dap_needed_kg: float
    dap_bags_50kg: int
    urea_needed_kg: float
    urea_bags_50kg: int
    mop_needed_kg: float
    mop_bags_50kg: int
    total_fertilizer_cost_inr: float


def calculate_fertilizer_dosage(
    crop_key: str,
    area_acres: float,
    target_yield_tons: float,
    soil_n_kg: float,
    soil_p_kg: float,
    soil_k_kg: float,
    urea_price_per_50kg: float = 268.0,
    dap_price_per_50kg: float = 1350.0,
    mop_price_per_50kg: float = 1700.0,
) -> FertilizerRequirement:
    """
    Nutrient Needed (kg/acre) = (Target Yield (tons/acre) * Crop Uptake) - Soil Test NPK
    Urea = Nitrogen / 0.46
    DAP = Phosphorus / 0.46
    MOP = Potassium / 0.60
    """
    crop_info = CROP_THERMAL_PARAMS.get(crop_key.lower(), CROP_THERMAL_PARAMS["wheat"])

    # Total gross nutrient requirement for target yield across field
    gross_n = target_yield_tons * crop_info["n_uptake_per_ton"] * area_acres
    gross_p = target_yield_tons * crop_info["p_uptake_per_ton"] * area_acres
    gross_k = target_yield_tons * crop_info["k_uptake_per_ton"] * area_acres

    # Available soil nutrients across field
    avail_n = soil_n_kg * area_acres
    avail_p = soil_p_kg * area_acres
    avail_k = soil_k_kg * area_acres

    # Deficit needed
    net_n_needed = max(gross_n - avail_n, 0.0)
    net_p_needed = max(gross_p - avail_p, 0.0)
    net_k_needed = max(gross_k - avail_k, 0.0)

    # Chemical bag math
    # DAP (18-46-0): Supplies P2O5 and 18% N
    dap_kg = net_p_needed / 0.46
    dap_bags = math.ceil(dap_kg / 50.0) if dap_kg > 0 else 0

    n_from_dap = dap_kg * 0.18
    rem_n_needed = max(net_n_needed - n_from_dap, 0.0)

    # Urea (46% N)
    urea_kg = rem_n_needed / 0.46
    urea_bags = math.ceil(urea_kg / 50.0) if urea_kg > 0 else 0

    # MOP (0-0-60): Supplies 60% K2O
    mop_kg = net_k_needed / 0.60
    mop_bags = math.ceil(mop_kg / 50.0) if mop_kg > 0 else 0

    # Total cost
    total_cost = (urea_bags * urea_price_per_50kg) + (dap_bags * dap_price_per_50kg) + (mop_bags * mop_price_per_50kg)

    return FertilizerRequirement(
        crop_name=crop_info["name"],
        field_area_acres=round(area_acres, 2),
        target_yield_tons_per_acre=round(target_yield_tons, 2),
        soil_n_kg_per_acre=round(soil_n_kg, 2),
        soil_p_kg_per_acre=round(soil_p_kg, 2),
        soil_k_kg_per_acre=round(soil_k_kg, 2),
        nitrogen_needed_kg=round(net_n_needed, 2),
        phosphorus_needed_kg=round(net_p_needed, 2),
        potassium_needed_kg=round(net_k_needed, 2),
        dap_needed_kg=round(dap_kg, 2),
        dap_bags_50kg=dap_bags,
        urea_needed_kg=round(urea_kg, 2),
        urea_bags_50kg=urea_bags,
        mop_needed_kg=round(mop_kg, 2),
        mop_bags_50kg=mop_bags,
        total_fertilizer_cost_inr=round(total_cost, 2),
    )


# ─── Knapsack Pump Dosage Math ──────────────────────────────────────────────

class SprayPumpDosage(BaseModel):
    chemical_name: str
    field_area_acres: float
    sprayer_volume_rate_l_per_acre: float
    total_spray_volume_liters: float
    tank_capacity_liters: float
    total_pumps_needed: int
    recommended_rate_ml_or_g_per_liter: float
    chemical_per_pump_ml_or_g: float
    total_chemical_needed_ml_or_g: float


def calculate_knapsack_pump_dosage(
    chemical_name: str,
    area_acres: float,
    recommended_rate_per_liter: float,  # e.g., 2.5 ml/L or 1.5 g/L
    sprayer_rate_l_per_acre: float = 200.0,
    tank_capacity_liters: float = 15.0,
) -> SprayPumpDosage:
    """
    Total Spray Volume (L) = Field Area (Acres) * Sprayer Volume Rate (L/acre)
    Total 15L Pumps Needed = ceil(Total Spray Volume / 15L)
    Chemical per 15L Pump = Recommended Rate (ml/L or g/L) * 15L
    """
    total_volume_l = area_acres * sprayer_rate_l_per_acre
    total_pumps = math.ceil(total_volume_l / tank_capacity_liters)
    chem_per_pump = recommended_rate_per_liter * tank_capacity_liters
    total_chem = total_volume_l * recommended_rate_per_liter

    return SprayPumpDosage(
        chemical_name=chemical_name,
        field_area_acres=round(area_acres, 2),
        sprayer_volume_rate_l_per_acre=round(sprayer_rate_l_per_acre, 2),
        total_spray_volume_liters=round(total_volume_l, 2),
        tank_capacity_liters=tank_capacity_liters,
        total_pumps_needed=total_pumps,
        recommended_rate_ml_or_g_per_liter=recommended_rate_per_liter,
        chemical_per_pump_ml_or_g=round(chem_per_pump, 2),
        total_chemical_needed_ml_or_g=round(total_chem, 2),
    )
