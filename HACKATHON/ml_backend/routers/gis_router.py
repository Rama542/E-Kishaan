"""
Dynamic GIS & Geodesic FastAPI Router
=====================================
Endpoints for Mandi Net Realization Price (Haversine freight transport cost & APMC commission deduction)
and WGS84 polygon area/perimeter calculations.
Zero static data.
"""

from typing import List, Tuple
from pydantic import BaseModel, Field
from fastapi import APIRouter

from services.gis_geodesic import (
    MandiPriceCalculation,
    PolygonGeodesicMetrics,
    calculate_mandi_net_realization,
    calculate_polygon_geodesic_metrics,
)

router = APIRouter(prefix="/api/gis", tags=["GIS Geodesic Engine"])


class MandiRealizationRequest(BaseModel):
    farm_lat: float = Field(..., example=30.9010)
    farm_lon: float = Field(..., example=75.8573)
    mandi_name: str = Field(..., example="Khanna Mandi")
    mandi_lat: float = Field(..., example=30.7024)
    mandi_lon: float = Field(..., example=76.2205)
    mandi_price_per_q: float = Field(..., example=2275.0)
    expected_yield_q: float = Field(50.0, example=50.0)
    freight_rate_per_km_q: float = Field(0.85, example=0.85)
    commission_pct: float = Field(2.5, example=2.5)


class PolygonMetricsRequest(BaseModel):
    coordinates: List[Tuple[float, float]] = Field(
        ...,
        example=[
            (30.9010, 75.8573),
            (30.9020, 75.8573),
            (30.9020, 75.8590),
            (30.9010, 75.8590),
        ]
    )


@router.post("/mandi-net-realization", response_model=MandiPriceCalculation)
async def get_mandi_net_realization(req: MandiRealizationRequest):
    return calculate_mandi_net_realization(
        farm_lat=req.farm_lat,
        farm_lon=req.farm_lon,
        mandi_name=req.mandi_name,
        mandi_lat=req.mandi_lat,
        mandi_lon=req.mandi_lon,
        mandi_price_per_q=req.mandi_price_per_q,
        expected_yield_q=req.expected_yield_q,
        freight_rate_per_km_q=req.freight_rate_per_km_q,
        commission_pct=req.commission_pct,
    )


@router.post("/polygon-metrics", response_model=PolygonGeodesicMetrics)
async def get_polygon_metrics(req: PolygonMetricsRequest):
    return calculate_polygon_geodesic_metrics(req.coordinates)
