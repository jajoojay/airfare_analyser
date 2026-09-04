from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.middleware.rate_limit import RateLimitMiddleware
from apps.api.routers.ai_router import router as ai_router
from apps.api.routers.api_v1 import router as api_v1_router
from apps.api.routers.exports import router as export_router
from apps.api.routers.ota_router import router as ota_router
from packages.shared.config import settings
from services.scheduler.collection_scheduler import CollectionScheduler

scheduler = CollectionScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: activate daily background scheduler
    try:
        scheduler.start(cron_hour=18, cron_minute=0)
        print("[*] Background CollectionScheduler running: Daily cron set to 18:00 IST.")
    except Exception as e:
        print(f"[!] Warning: CollectionScheduler startup exception: {e}")
    yield
    # Shutdown
    scheduler.stop()
    print("[*] CollectionScheduler cleanly stopped.")


app = FastAPI(
    title="India Airfare Price Observatory API",
    description="Production High-Frequency Statistical Airfare Price Index & Monitoring Platform for the Ministry of Statistics and Programme Implementation (MoSPI / NSO)",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=120)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)
app.include_router(export_router)
app.include_router(ai_router)
app.include_router(ota_router)


@app.get("/")
def root():
    """Root metadata & service identity."""
    return {
        "service": "India Airfare Price Observatory API",
        "authority": "Ministry of Statistics & Programme Implementation (MoSPI / NSO)",
        "active_methodology_version": settings.ACTIVE_METHODOLOGY_VERSION,
        "active_weight_version": settings.ACTIVE_WEIGHT_VERSION,
        "anchor_lead_time": settings.ANCHOR_LEAD_TIME,
        "base_period": settings.BASE_PERIOD,
        "documentation": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "methodology": settings.ACTIVE_METHODOLOGY_VERSION,
    }
