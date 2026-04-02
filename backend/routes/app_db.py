"""
routes/app_db.py
────────────────────────────────────────────────────────────────
All API endpoints that manipulate the APPLICATION database (app.db).
This keeps user / auth / app-metadata concerns entirely separate
from the analytical sqlite database (sql_ai.db).

Endpoints
─────────
AUTH
  POST /auth/register   – create a new account
  POST /auth/login      – email + password login (returns user info)
  POST /auth/logout     – stateless logout (client drops token)

USERS
  GET  /users/me/{user_id}         – get profile
  PUT  /users/me/{user_id}         – update username / role
  PUT  /users/me/{user_id}/password – change password

CHART HISTORY  (app.db – SavedChart)
  GET  /app/charts                 – get all saved charts (optionally by user)
  POST /app/charts                 – save a new chart record
  DELETE /app/charts/{chart_id}    – delete a chart record

TABLE METADATA  (app.db – SavedTable)
  GET  /app/tables                 – get all tracked table metadata
  POST /app/tables                 – add / upsert a table record
  DELETE /app/tables/{table_id}    – remove a table record

STATS
  GET  /app/stats                  – aggregate counts for dashboard

Note: Password hashing uses bcrypt via the `passlib` library.
      Install with: pip install passlib[bcrypt]
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import bcrypt

from app_db_models import SessionLocal, User, SavedChart, SavedTable

router = APIRouter(prefix="/app", tags=["app-db"])

# ── Password hashing ──────────────────────────────────────────────────────────

def _truncate(plain: str) -> bytes:
    """Bcrypt only uses the first 72 bytes; truncate explicitly to avoid surprises."""
    return plain.encode("utf-8")[:72]

def hash_password(plain: str) -> str:
    # Hash password with a salt, and decode back to string for database storage
    hashed_bytes = bcrypt.hashpw(_truncate(plain), bcrypt.gensalt())
    return hashed_bytes.decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_truncate(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


# ── DB session dependency ─────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class SaveChartRequest(BaseModel):
    user_id:    Optional[int] = None
    title:      str
    chart_type: str
    color:      Optional[str] = "#6366f1"
    sql_query:  str
    x_key:      str
    y_key:      str

class SaveTableRequest(BaseModel):
    user_id:    Optional[int] = None
    table_name: str
    row_count:  Optional[int] = 0
    col_count:  Optional[int] = 0


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/auth/register", summary="Register a new user account")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new user. Returns the created user profile (no password).
    Raises 409 if the email is already registered.
    """
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(
        username=req.username,
        email=req.email,
        password=hash_password(req.password),
        role=req.role or "user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "Account created successfully.",
        "user": _safe_user(user),
    }


@router.post("/auth/login", summary="Login with email and password")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Verify credentials and return the user profile.
    This is stateless – session management is handled client-side.
    Raises 401 on incorrect credentials.
    """
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    return {
        "status": "success",
        "message": "Login successful.",
        "user": _safe_user(user),
    }


@router.post("/auth/logout", summary="Logout (stateless – client clears session)")
def logout():
    """
    Stateless logout. The client should discard its stored user info.
    """
    return {"status": "success", "message": "Logged out successfully."}


# ═══════════════════════════════════════════════════════════════════════════════
#  USER / PROFILE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users/me/{user_id}", summary="Get user profile")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = _get_user_or_404(user_id, db)
    return {"status": "success", "user": _safe_user(user)}


@router.put("/users/me/{user_id}", summary="Update username or role")
def update_profile(user_id: int, req: UpdateProfileRequest, db: Session = Depends(get_db)):
    user = _get_user_or_404(user_id, db)

    if req.username is not None:
        user.username = req.username
    if req.role is not None:
        user.role = req.role

    db.commit()
    db.refresh(user)
    return {"status": "success", "message": "Profile updated.", "user": _safe_user(user)}


@router.put("/users/me/{user_id}/password", summary="Change password")
def change_password(user_id: int, req: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = _get_user_or_404(user_id, db)

    if not verify_password(req.current_password, user.password):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    user.password = hash_password(req.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}


# ═══════════════════════════════════════════════════════════════════════════════
#  CHART HISTORY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/charts", summary="Get all saved chart records")
def get_charts(user_id: Optional[int] = None, limit: int = 20, db: Session = Depends(get_db)):
    q = db.query(SavedChart)
    if user_id is not None:
        q = q.filter(SavedChart.user_id == user_id)
    charts = q.order_by(SavedChart.created_at.desc()).limit(limit).all()
    return {"status": "success", "charts": [_chart_dict(c) for c in charts]}


@router.post("/charts", summary="Save a new chart record to app.db")
def save_chart(req: SaveChartRequest, db: Session = Depends(get_db)):
    chart = SavedChart(
        user_id=req.user_id,
        title=req.title,
        chart_type=req.chart_type,
        color=req.color or "#6366f1",
        sql_query=req.sql_query,
        x_key=req.x_key,
        y_key=req.y_key,
    )
    db.add(chart)
    db.commit()
    db.refresh(chart)
    return {"status": "success", "chart": _chart_dict(chart)}


@router.delete("/charts/{chart_id}", summary="Delete a saved chart")
def delete_chart(chart_id: int, db: Session = Depends(get_db)):
    chart = db.query(SavedChart).filter(SavedChart.id == chart_id).first()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found.")
    db.delete(chart)
    db.commit()
    return {"status": "success", "message": f"Chart {chart_id} deleted."}


# ═══════════════════════════════════════════════════════════════════════════════
#  TABLE METADATA ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/tables", summary="Get all tracked table metadata")
def get_tables(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(SavedTable)
    if user_id is not None:
        q = q.filter(SavedTable.user_id == user_id)
    tables = q.order_by(SavedTable.created_at.desc()).all()
    return {"status": "success", "tables": [_table_dict(t) for t in tables]}


@router.post("/tables", summary="Add or update a table metadata record")
def save_table(req: SaveTableRequest, db: Session = Depends(get_db)):
    """
    Upsert: if a record with the same table_name (+ user_id) already exists,
    update its counts; otherwise insert a new record.
    """
    q = db.query(SavedTable).filter(SavedTable.table_name == req.table_name)
    if req.user_id is not None:
        q = q.filter(SavedTable.user_id == req.user_id)
    existing = q.first()

    if existing:
        existing.row_count    = req.row_count
        existing.col_count    = req.col_count
        existing.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return {"status": "success", "table": _table_dict(existing)}

    record = SavedTable(
        user_id=req.user_id,
        table_name=req.table_name,
        row_count=req.row_count,
        col_count=req.col_count,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"status": "success", "table": _table_dict(record)}


@router.delete("/tables/{table_id}", summary="Remove a table metadata record")
def delete_table(table_id: int, db: Session = Depends(get_db)):
    record = db.query(SavedTable).filter(SavedTable.id == table_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Table record not found.")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Table record {table_id} removed."}


# ═══════════════════════════════════════════════════════════════════════════════
#  STATS ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/stats", summary="Aggregate usage stats from app.db")
def get_stats(db: Session = Depends(get_db)):
    """
    Returns high-level counters useful for the dashboard / Account page.
    """
    total_users  = db.query(User).count()
    total_charts = db.query(SavedChart).count()
    total_tables = db.query(SavedTable).count()
    total_rows   = db.query(SavedTable).with_entities(
        SavedTable.row_count
    ).all()
    total_row_count = sum(r[0] or 0 for r in total_rows)

    return {
        "status": "success",
        "stats": {
            "total_users":     total_users,
            "total_charts":    total_charts,
            "total_tables":    total_tables,
            "total_row_count": total_row_count,
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


def _safe_user(user: User) -> dict:
    """Return user dict without the password field."""
    return {
        "id":        user.id,
        "username":  user.username,
        "email":     user.email,
        "role":      user.role,
        "is_active": user.is_active,
        "joined_at": user.joined_at.isoformat() if user.joined_at else None,
    }


def _chart_dict(c: SavedChart) -> dict:
    return {
        "id":         c.id,
        "user_id":    c.user_id,
        "title":      c.title,
        "type":       c.chart_type,
        "color":      c.color,
        "sql_query":  c.sql_query,
        "x_key":      c.x_key,
        "y_key":      c.y_key,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


def _table_dict(t: SavedTable) -> dict:
    return {
        "id":           t.id,
        "user_id":      t.user_id,
        "table_name":   t.table_name,
        "row_count":    t.row_count,
        "col_count":    t.col_count,
        "created_at":   t.created_at.isoformat() if t.created_at else None,
        "last_updated": t.last_updated.isoformat() if t.last_updated else None,
    }
