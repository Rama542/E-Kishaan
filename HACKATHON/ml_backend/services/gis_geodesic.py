"""
Dynamic GIS & Geodesic Distance Engine
=======================================
Calculates WGS84 geodesic distances via Haversine, WGS84 polygon area
(m², Acres, Hectares), perimeter, and Mandi Net Realized Price math.
Zero static data.
"""

import math
from typing import List, Tuple, Dict, Any
from pydantic import BaseModel

EARTH_RADIUS_KM = 6371.0
EARTH_RADIUS_METERS = 6371000.0
SQ_METERS_PER_ACRE = 4046.8564224


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes geodesic distance D between (lat1, lon1) and (lat2, lon2) in km.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


class MandiPriceCalculation(BaseModel):
    mandi_name: str
    mandi_lat: float
    mandi_lon: float
    distance_km: float
    raw_mandi_price_inr_per_q: float
    freight_rate_per_km_q: float
    transport_cost_inr_per_q: float
    commission_percent: float
    commission_inr_per_q: float
    net_realized_price_inr_per_q: float
    estimated_total_net_revenue_inr: float


def calculate_mandi_net_realization(
    farm_lat: float,
    farm_lon: float,
    mandi_name: str,
    mandi_lat: float,
    mandi_lon: float,
    mandi_price_per_q: float,
    expected_yield_q: float = 50.0,
    freight_rate_per_km_q: float = 0.85,
    commission_pct: float = 2.5,
) -> MandiPriceCalculation:
    """
    Transport Cost = Distance * Freight Rate
    Net Realized Price = Mandi Price - Transport Cost - Commission
    """
    dist_km = haversine_distance_km(farm_lat, farm_lon, mandi_lat, mandi_lon)
    transport_cost = dist_km * freight_rate_per_km_q
    commission_cost = mandi_price_per_q * (commission_pct / 100.0)
    net_price = mandi_price_per_q - transport_cost - commission_cost
    total_net_rev = net_price * expected_yield_q

    return MandiPriceCalculation(
        mandi_name=mandi_name,
        mandi_lat=mandi_lat,
        mandi_lon=mandi_lon,
        distance_km=round(dist_km, 2),
        raw_mandi_price_inr_per_q=round(mandi_price_per_q, 2),
        freight_rate_per_km_q=round(freight_rate_per_km_q, 2),
        transport_cost_inr_per_q=round(transport_cost, 2),
        commission_percent=round(commission_pct, 2),
        commission_inr_per_q=round(commission_cost, 2),
        net_realized_price_inr_per_q=round(net_price, 2),
        estimated_total_net_revenue_inr=round(total_net_rev, 2),
    )


class PolygonGeodesicMetrics(BaseModel):
    area_sq_meters: float
    area_acres: float
    area_hectares: float
    perimeter_meters: float
    centroid_lat: float
    centroid_lon: float


def calculate_polygon_geodesic_metrics(coordinates: List[Tuple[float, float]]) -> PolygonGeodesicMetrics:
    """
    Computes WGS84 geodesic area (m^2, Acres, Hectares), perimeter, and centroid coordinates.
    coordinates: List of (lat, lon) tuples.
    """
    if len(coordinates) < 3:
        raise ValueError("A polygon must have at least 3 coordinates.")

    # Ensure closed polygon for area/perimeter math
    coords = list(coordinates)
    if coords[0] != coords[-1]:
        coords.append(coords[0])

    n = len(coords)
    # Centroid
    sum_lat = sum(c[0] for c in coords[:-1])
    sum_lon = sum(c[1] for c in coords[:-1])
    c_lat = sum_lat / (n - 1)
    c_lon = sum_lon / (n - 1)

    # WGS84 Spherical Area math
    total_area_rad = 0.0
    for i in range(n - 1):
        p1 = coords[i]
        p2 = coords[i + 1]
        phi1 = math.radians(p1[0])
        phi2 = math.radians(p2[0])
        delta_lambda = math.radians(p2[1] - p1[1])
        total_area_rad += delta_lambda * (2.0 + math.sin(phi1) + math.sin(phi2))

    area_m2 = abs(total_area_rad * (EARTH_RADIUS_METERS ** 2) / 4.0)
    area_acres = area_m2 / SQ_METERS_PER_ACRE
    area_hectares = area_m2 / 10000.0

    # Perimeter math
    perimeter_m = 0.0
    for i in range(n - 1):
        perimeter_m += haversine_distance_km(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]) * 1000.0

    return PolygonGeodesicMetrics(
        area_sq_meters=round(area_m2, 2),
        area_acres=round(area_acres, 3),
        area_hectares=round(area_hectares, 3),
        perimeter_meters=round(perimeter_m, 2),
        centroid_lat=round(c_lat, 6),
        centroid_lon=round(c_lon, 6),
    )
