import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from . import auth, models
    from .database import engine, get_db
    from .engine.payloads import ALL_TESTS, GANDALF_SPECIFIC_TESTS, QUICK_SCAN_TESTS
    from .engine.security import SecurityEngine
except ImportError:
    import auth
    import models
    from database import engine, get_db
    from engine.payloads import ALL_TESTS, GANDALF_SPECIFIC_TESTS, QUICK_SCAN_TESTS
    from engine.security import SecurityEngine

# Initialize the database schemas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZYNTH Security API", version="0.1.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ZYNTH_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allowed_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPORTED_TARGETS = {
    "mock": {
        "label": "Demo Agent",
        "description": "Runs the full adversarial suite against a simulated vulnerable target.",
        "requires_api_key": False,
        "requires_endpoint": False,
    },
    "local": {
        "label": "Local Sandbox",
        "description": "Targets the bundled local agent running on http://localhost:8001/chat.",
        "requires_api_key": False,
        "requires_endpoint": False,
    },
    "gandalf": {
        "label": "Gandalf Challenge",
        "description": "Runs a limited external scan against Lakera's Gandalf playground.",
        "requires_api_key": False,
        "requires_endpoint": False,
    },
    "live": {
        "label": "Anthropic API",
        "description": "Directly red-teams a live Anthropic model using your API key.",
        "requires_api_key": True,
        "requires_endpoint": False,
    },
    "custom": {
        "label": "Custom API",
        "description": "Sends adversarial prompts to your own JSON API endpoint.",
        "requires_api_key": False,
        "requires_endpoint": True,
    },
}

PATCH_OUTPUT_DIR = Path(__file__).resolve().parent / "generated_patches"
PATCH_OUTPUT_DIR.mkdir(exist_ok=True)

class UserCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=320)
    password: str = Field(..., min_length=10, max_length=128)

class ScanRequest(BaseModel):
    api_key: Optional[str] = None
    target: str = "mock"
    target_endpoint: Optional[str] = None

class FirewallRequest(BaseModel):
    payload: str = Field(..., min_length=1, max_length=20000)
    source: Optional[str] = "api"

class PatchRequest(BaseModel):
    test_id: str = Field(..., min_length=3, max_length=120)
    target: str = Field(..., min_length=2, max_length=50)
    patch_code: str = Field(..., min_length=10)

def _normalize_email(email: str) -> str:
    return email.strip().lower()

def _validate_email(email: str) -> None:
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Enter a valid email address")

def _resolve_scan_suite(target: str):
    if target == "mock":
        return ALL_TESTS
    if target == "gandalf":
        return GANDALF_SPECIFIC_TESTS
    return QUICK_SCAN_TESTS

def _validate_scan_request(request: ScanRequest) -> None:
    if request.target not in SUPPORTED_TARGETS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported target '{request.target}'.",
        )

    target_config = SUPPORTED_TARGETS[request.target]
    if target_config["requires_api_key"] and not (
        request.api_key or os.getenv("ANTHROPIC_API_KEY")
    ):
        raise HTTPException(
            status_code=400,
            detail="A live Anthropic scan requires an API key.",
        )
    if target_config["requires_endpoint"] and not (
        request.target_endpoint or os.getenv("ZYNTH_TARGET_ENDPOINT")
    ):
        raise HTTPException(
            status_code=400,
            detail="A custom API scan requires a target endpoint.",
        )

def _build_patch_bundle(
    request: PatchRequest,
    current_user: models.User,
) -> dict:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_test_id = re.sub(r"[^a-z0-9]+", "-", request.test_id.lower()).strip("-")
    safe_target = re.sub(r"[^a-z0-9]+", "-", request.target.lower()).strip("-")
    artifact_id = f"{timestamp}-{safe_target or 'target'}-{safe_test_id or 'finding'}"
    artifact_dir = PATCH_OUTPUT_DIR / artifact_id
    artifact_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "artifact_id": artifact_id,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "workspace_id": current_user.workspace_id,
        "owner_email": current_user.email,
        "test_id": request.test_id,
        "target": request.target,
        "status": "review_required",
    }

    (artifact_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )
    (artifact_dir / "patch.py").write_text(request.patch_code, encoding="utf-8")
    (artifact_dir / "README.txt").write_text(
        "\n".join(
            [
                "Zynth Patch Bundle",
                "",
                f"Finding: {request.test_id}",
                f"Target: {request.target}",
                "",
                "This bundle is intentionally review-first.",
                "Inspect patch.py, validate it in your environment, then deploy it through your own release flow.",
            ]
        ),
        encoding="utf-8",
    )

    return {
        "artifact_id": artifact_id,
        "artifact_path": str(artifact_dir),
    }

@app.post("/api/auth/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    email = _normalize_email(user.email)
    _validate_email(email)

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user.password)
    workspace_name = f"{email.split('@')[0]}'s Workspace"
    new_workspace = models.Workspace(name=workspace_name)
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)

    new_user = models.User(
        email=email,
        hashed_password=hashed_password,
        workspace_id=new_workspace.id,
    )
    db.add(new_user)
    db.commit()
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {
        "message": "User created successfully",
        "workspace_id": new_workspace.id,
        "access_token": access_token,
        "token_type": "bearer",
    }

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = _normalize_email(form_data.username)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
def get_current_profile(current_user: models.User = Depends(auth.require_current_user)):
    return {
        "email": current_user.email,
        "workspace_id": current_user.workspace_id,
        "created_at": current_user.created_at.isoformat(),
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "operational",
        "engine": "ZYNTH-A01",
        "supported_targets": SUPPORTED_TARGETS,
    }

@app.post("/api/scan")
async def run_security_scan(
    request: ScanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_current_user),
):
    try:
        _validate_scan_request(request)
        security_engine = SecurityEngine(
            api_key=request.api_key,
            target=request.target,
            target_endpoint=request.target_endpoint,
        )
        report = await security_engine.run_scan(
            _resolve_scan_suite(request.target),
            db=db,
            workspace_id=current_user.workspace_id,
            use_llm_judge=request.target in {"live", "custom"},
        )
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_scan_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_current_user),
):
    try:
        records = (
            db.query(models.ScanHistory)
            .filter(models.ScanHistory.workspace_id == current_user.workspace_id)
            .order_by(models.ScanHistory.timestamp.asc())
            .all()
        )
        return [
            {
                "timestamp": int(record.timestamp.timestamp()),
                "date": record.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "risk_score": record.risk_score,
                "target": record.target,
                "vulnerabilities": record.vulnerabilities,
                "total_tests": record.total_tests,
                "trend": record.trend,
            }
            for record in records
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/firewall")
async def evaluate_firewall(
    request: FirewallRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_current_user),
):
    try:
        from .engine.active_firewall import firewall_engine
    except ImportError:
        from engine.active_firewall import firewall_engine

    decision = firewall_engine.evaluate_request(
        request.payload,
        request.source,
        db=db,
        workspace_id=current_user.workspace_id,
    )
    if decision["action"] == "BLOCK":
        raise HTTPException(status_code=403, detail=decision)
    return decision

@app.post("/api/webhook/make")
async def make_n8n_webhook(
    request: FirewallRequest,
    db: Session = Depends(get_db),
    x_zynth_webhook_key: Optional[str] = Header(default=None, alias="X-Zynth-Webhook-Key"),
):
    try:
        from .engine.active_firewall import firewall_engine
    except ImportError:
        from engine.active_firewall import firewall_engine

    webhook_secret = os.getenv("ZYNTH_WEBHOOK_SECRET")
    if webhook_secret and x_zynth_webhook_key != webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook key",
        )

    decision = firewall_engine.evaluate_request(
        request.payload,
        request.source,
        db=db,
        workspace_id=None,
    )
    return {
        "zynth_firewall_action": decision["action"],
        "is_safe": decision["action"] == "ALLOW",
        "category": decision["category"],
        "reason": decision["reason"],
        "payload_tested": decision["payload_snippet"],
    }

@app.get("/api/firewall/logs")
async def get_firewall_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_current_user),
):
    logs = (
        db.query(models.FirewallLog)
        .filter(models.FirewallLog.workspace_id == current_user.workspace_id)
        .order_by(models.FirewallLog.timestamp.asc())
        .all()
    )

    if not logs:
        try:
            from .engine.active_firewall import firewall_engine
        except ImportError:
            from engine.active_firewall import firewall_engine
        return firewall_engine.history

    return [
        {
            "id": f"fw_{log.id}",
            "timestamp": log.timestamp.strftime("%H:%M:%S"),
            "source": log.source,
            "payload_snippet": log.payload_snippet,
            "action": log.action,
            "category": log.category,
            "reason": log.reason,
        }
        for log in logs
    ]

@app.post("/api/patch/apply")
async def apply_remediation_patch(
    request: PatchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_current_user),
):
    try:
        patch_bundle = _build_patch_bundle(request, current_user)
        return {
            "status": "BUNDLE_CREATED",
            "message": (
                "Patch bundle created. Review the generated files before deploying "
                f"to {request.target}."
            ),
            "test_id": request.test_id,
            **patch_bundle,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
