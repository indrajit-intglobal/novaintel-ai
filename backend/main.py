from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import sys

from api.routers import auth, projects, upload, insights, proposal, case_studies, rag, agents, case_study_documents, search, notifications
from db.database import engine, Base
from utils.config import settings

# Request logging middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/agents"):
            print(f"\n🔔 REQUEST: {request.method} {request.url.path}", file=sys.stderr, flush=True)
            print(f"   Query params: {dict(request.query_params)}", file=sys.stderr, flush=True)
        response = await call_next(request)
        if request.url.path.startswith("/agents"):
            print(f"   Response status: {response.status_code}", file=sys.stderr, flush=True)
        return response

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created/verified")
    except Exception as e:
        print(f"⚠ Database initialization warning: {e}")
    
    # Initialize services
    from utils.gemini_service import gemini_service
    from rag.vector_store import vector_store_manager
    
    if gemini_service.is_available():
        print(f"✓ Gemini service ready: {settings.GEMINI_MODEL}")
    else:
        print("⚠ Gemini service not available - check GEMINI_API_KEY")
    
    if vector_store_manager.is_available():
        print(f"✓ Vector store ready: {settings.VECTOR_DB_TYPE}")
    else:
        print("⚠ Vector store not available - check VECTOR_DB_TYPE and configuration")
    
    yield
    # Shutdown
    pass

app = FastAPI(
    title="NovaIntel API",
    description="AI-powered presales platform backend API",
    version="1.0.0",
    lifespan=lifespan
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Provide detailed validation error messages."""
    import json
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({
            "field": field if field else "body",
            "message": error["msg"],
            "type": error["type"],
            "input": str(error.get("input", ""))[:100] if error.get("input") else None
        })
    
    # Log the error for debugging
    print(f"\n{'='*60}")
    print(f"VALIDATION ERROR on {request.method} {request.url.path}")
    print(f"Validation errors:")
    print(json.dumps(errors, indent=2))
    print(f"{'='*60}\n")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors,
            "message": "Request validation failed. Check the 'errors' field for details.",
            "hint": "Required fields: name, client_name, industry, region, project_type ('new'|'expansion'|'renewal')"
        }
    )

# CORS middleware - MUST be added FIRST to handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts_list
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])
app.include_router(proposal.router, prefix="/proposal", tags=["Proposal"])
app.include_router(case_studies.router, prefix="/case-studies", tags=["Case Studies"])
app.include_router(rag.router, prefix="/rag", tags=["RAG"])
app.include_router(agents.router, prefix="/agents", tags=["Multi-Agent Workflow"])
app.include_router(case_study_documents.router, prefix="/case-study-documents", tags=["Case Study Documents"])
app.include_router(search.router, prefix="", tags=["Search"])
app.include_router(notifications.router, prefix="", tags=["Notifications"])

@app.get("/")
async def root():
    return {
        "message": "NovaIntel API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

