"""
AgriSmart ML Backend — FastAPI Main Server
==========================================
Production-grade FastAPI server with:
- CORS for React frontend
- Startup model pre-training (models are ready instantly when requests arrive)
- Comprehensive error handling and logging
- Health check with model status
- Auto-generated API docs at /docs
"""

import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure structured logging
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ─── Startup: Pre-train all ML models ────────────────────────────────────────

SUPPORTED_CROPS = ["rice", "coconut", "pepper"]
_startup_status = {}


async def pretrain_all_models():
    """Pre-train all ML models on startup so first request is instant."""
    from data.fetch_agmarknet import get_monthly_aggregated
    from models.price_forecaster import get_or_train_model

    for crop in SUPPORTED_CROPS:
        try:
            logger.info(f"⏳ Pre-training model for {crop}...")
            monthly_df = get_monthly_aggregated(crop)
            raw_df = monthly_df[["date", "modal_price", "min_price", "max_price"]].copy()
            model = get_or_train_model(crop, raw_df)
            _startup_status[crop] = {
                "status": "ready",
                "prophet": model.prophet.fitted,
                "xgboost": model.xgboost.fitted,
                "records": len(raw_df),
            }
            logger.info(f"✅ Model ready for {crop}")
        except Exception as e:
            logger.error(f"❌ Failed to train model for {crop}: {e}")
            _startup_status[crop] = {"status": "error", "error": str(e)}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan: train models on startup."""
    logger.info("🚀 AgriSmart ML Backend starting up...")
    await pretrain_all_models()
    logger.info("✅ All models ready. Server is live.")
    yield
    logger.info("🛑 AgriSmart ML Backend shutting down.")


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="AgriSmart ML Backend",
    description=(
        "Professional AI-powered agricultural market intelligence API. "
        "Serves real crop price data and ML-generated forecasts using "
        "XGBoost + Prophet ensemble models trained on Agmarknet government data."
    ),
    version="2.0.0",
    contact={
        "name": "AgriSmart Team",
        "url": "https://agrismart.ai",
    },
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
from routers.market import router as market_router
from routers.soil_ai import router as soil_router
from routers.crop_ai import router as crop_router
from routers.roadmap_ai import router as roadmap_router
from routers.roadmap_engine import router as roadmap_engine_router
from routers.journal_engine import router as journal_engine_router
from routers.agronomy_router import router as agronomy_router
from routers.finance_router import router as finance_router
from routers.gis_router import router as gis_router
from routers.weather_router import router as weather_router
from routers.offline_router import router as offline_router

app.include_router(market_router, prefix="/api")
app.include_router(soil_router, prefix="/api")
app.include_router(crop_router)
app.include_router(roadmap_router)
app.include_router(roadmap_engine_router)
app.include_router(journal_engine_router)
app.include_router(agronomy_router)
app.include_router(finance_router)
app.include_router(gis_router)
app.include_router(weather_router)
app.include_router(offline_router)

# ─── Root & Health ────────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
async def root():
    return {
        "service": "AgriSmart ML Backend",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/health", tags=["System"])
async def health_check():
    """Comprehensive health check including ML model status."""
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": _startup_status,
        "endpoints": {
            "market_prices": "/api/market/prices",
            "crop_list": "/api/market/crops",
            "model_refresh": "/api/market/refresh/{crop}",
            "docs": "/docs",
        },
    })
