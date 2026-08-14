"""
Dynamic Weather & Ag-Risk Telemetry FastAPI Router
===================================================
Fetches live Open-Meteo data for farm coordinates and computes risk alerts dynamically.
Zero static data.
"""

from fastapi import APIRouter, Query
from services.weather_telemetry import (
    WeatherTelemetrySummary,
    fetch_live_weather_telemetry,
)

router = APIRouter(prefix="/api/weather", tags=["Weather Telemetry Engine"])


@router.get("/telemetry", response_model=WeatherTelemetrySummary)
async def get_weather_telemetry(
    lat: float = Query(30.9010, description="Farm centroid latitude"),
    lon: float = Query(75.8573, description="Farm centroid longitude"),
):
    return fetch_live_weather_telemetry(lat, lon)
