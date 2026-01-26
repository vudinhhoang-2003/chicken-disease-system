"""FastAPI main application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.core.database import engine, Base
from app.core import models # Import models to register them with Base
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Tables
Base.metadata.create_all(bind=engine)

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Chicken Disease Diagnosis API",
    description="AI-powered chicken disease detection and diagnosis system",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Starting Chicken Disease Diagnosis API...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    
    # Initialize YOLO models
    try:
        from app.services import get_yolo_service
        yolo_service = get_yolo_service()
        logger.info("✅ YOLO Service initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize YOLO Service: {e}")
    
    # Initialize Database & Seed Data
    try:
        from app.core.database import SessionLocal
        from app.core.seed import seed_knowledge_base
        db = SessionLocal()
        seed_knowledge_base(db)
        db.close()
    except Exception as e:
        logger.error(f"❌ Failed to seed database: {e}")
    
    # TODO: Initialize RAG service
    # TODO: Initialize database connection
    
    logger.info("✅ Startup complete!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Shutting down...")
    
    # TODO: Cleanup resources
    
    logger.info("✅ Shutdown complete!")


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "Chicken Disease Diagnosis API",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "camera_stream": "/ws/camera-stream",
            "classify": "/api/v1/detect/classify",
            "chat": "/api/v1/chat/ask"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from app.services import get_yolo_service
    
    try:
        yolo_service = get_yolo_service()
        models_loaded = (
            yolo_service.detection_model is not None and 
            yolo_service.classification_model is not None
        )
    except:
        models_loaded = False
    
    return {
        "status": "healthy",
        "environment": settings.environment,
        "models_loaded": models_loaded,
        "database_connected": False,  # TODO: Check database connection
    }


# Include routers
from app.api.v1.endpoints import detect, chat, admin, auth
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(detect.router, prefix="/api/v1/detect", tags=["detection"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
# app.include_router(stream.router, prefix="/ws", tags=["websocket"])
