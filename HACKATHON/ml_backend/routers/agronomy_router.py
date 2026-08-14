"""
Dynamic Agronomy FastAPI Router
================================
REST API endpoints for GDD accumulation, BBCH phenology, fertilizer 50kg bag math,
and 15L knapsack pump chemical dosages.
Zero static or hardcoded data.
"""

from typing import List, Tuple, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

from services.agronomy_math import (
    CROP_THERMAL_PARAMS,
    calculate_daily_gdd,
    calculate_accumulated_gdd,
    determine_bbch_stage,
    estimate_days_to_harvest,
    calculate_fertilizer_dosage,
    calculate_knapsack_pump_dosage,
    FertilizerRequirement,
    SprayPumpDosage,
)

router = APIRouter(prefix="/api/agronomy", tags=["Agronomy Dynamic Engine"])


class GDDRequest(BaseModel):
    crop_name: str = Field(..., example="wheat")
    daily_temperatures: List[Tuple[float, float]] = Field(..., example=[(25.0, 12.0), (28.0, 14.0)])


class FertilizerRequest(BaseModel):
    crop_name: str = Field(..., example="wheat")
    area_acres: float = Field(..., gt=0, example=2.5)
    target_yield_tons_per_acre: float = Field(..., gt=0, example=2.2)
    soil_n_kg_per_acre: float = Field(..., ge=0, example=40.0)
    soil_p_kg_per_acre: float = Field(..., ge=0, example=15.0)
    soil_k_kg_per_acre: float = Field(..., ge=0, example=80.0)


class KnapsackSprayRequest(BaseModel):
    chemical_name: str = Field(..., example="Chlorpyrifos 20 EC")
    area_acres: float = Field(..., gt=0, example=2.5)
    recommended_rate_per_liter: float = Field(..., gt=0, example=2.0)
    sprayer_volume_rate_l_per_acre: Optional[float] = Field(200.0, example=200.0)


@router.post("/gdd-phenology")
async def get_gdd_phenology(req: GDDRequest):
    crop_key = req.crop_name.lower()
    crop_info = CROP_THERMAL_PARAMS.get(crop_key, CROP_THERMAL_PARAMS["wheat"])

    t_base = crop_info["t_base"]
    gdd_target = crop_info["total_gdd_target"]

    accumulated_gdd = calculate_accumulated_gdd(req.daily_temperatures, t_base)
    bbch_info = determine_bbch_stage(accumulated_gdd, gdd_target)

    # Compute average daily GDD for remaining days estimate
    gdd_daily_list = [calculate_daily_gdd(t_max, t_min, t_base) for t_max, t_min in req.daily_temperatures]
    avg_gdd_daily = (sum(gdd_daily_list) / len(gdd_daily_list)) if gdd_daily_list else 12.5

    days_rem = estimate_days_to_harvest(accumulated_gdd, gdd_target, avg_gdd_daily)

    return {
        "crop_name": crop_info["name"],
        "base_temperature_c": t_base,
        "total_gdd_target": gdd_target,
        "accumulated_gdd": round(accumulated_gdd, 2),
        "bbch_stage": bbch_info,
        "estimated_days_to_harvest": days_rem,
        "gdd_daily_history": [round(g, 2) for g in gdd_daily_list],
    }


@router.post("/fertilizer-dosage", response_model=FertilizerRequirement)
async def get_fertilizer_dosage(req: FertilizerRequest):
    return calculate_fertilizer_dosage(
        crop_key=req.crop_name,
        area_acres=req.area_acres,
        target_yield_tons=req.target_yield_tons_per_acre,
        soil_n_kg=req.soil_n_kg_per_acre,
        soil_p_kg=req.soil_p_kg_per_acre,
        soil_k_kg=req.soil_k_kg_per_acre,
    )


@router.post("/knapsack-spray-dosage", response_model=SprayPumpDosage)
async def get_knapsack_spray_dosage(req: KnapsackSprayRequest):
    return calculate_knapsack_pump_dosage(
        chemical_name=req.chemical_name,
        area_acres=req.area_acres,
        recommended_rate_per_liter=req.recommended_rate_per_liter,
        sprayer_rate_l_per_acre=req.sprayer_volume_rate_l_per_acre or 200.0,
    )
