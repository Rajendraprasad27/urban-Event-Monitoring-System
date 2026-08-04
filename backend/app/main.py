from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import ai, analytics, auth, events, monitoring
from app.api.websocket.socket_manager import manager, websocket_endpoint
from app.core.config import get_settings
from app.core.database import close_mongo_connection, connect_to_mongo
import uvicorn

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    from app.services.clustering.bootstrap import init_clusters
    await init_clusters()
    try:
        yield
    finally:
        await close_mongo_connection()


from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title=f"{settings.app_name} API",
    description="Backend API for Urban Event Monitoring System",
    version="1.0.0",
    lifespan=lifespan,
)

# Mount static directory for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(ai.router, prefix="/api", tags=["ai"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])

app.add_api_websocket_route("/ws/events", websocket_endpoint)

@app.get("/")
def root():
    return {"message": "Welcome to CityMind AI API", "docs": "/docs", "health": "/api/monitoring/health"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
