"""
app_db_models.py
─────────────────────────────────────────────────────────────
Defines the SQLAlchemy ORM models for the APPLICATION database.
This is a separate SQLite file (app.db) that stores:
  • User      – registered accounts (email + hashed password)
  • SavedTable – metadata about user-created tables in sql_ai.db
  • SavedChart – metadata / history of AI-generated charts

The user-facing (analytical) data still lives in sql_ai.db.
This file only handles app-level, account-related data.
"""

from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, Text, Boolean
)
from sqlalchemy.orm import declarative_base, sessionmaker

# ── Engine & Base ─────────────────────────────────────────────────────────────
APP_DB_URL = "sqlite:///app.db"
engine = create_engine(APP_DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    """Registered application users."""
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username   = Column(String(80),  nullable=False)
    email      = Column(String(120), unique=True, nullable=False, index=True)
    password   = Column(String(256), nullable=False)   # bcrypt hash
    role       = Column(String(40),  default="user")
    is_active  = Column(Boolean,     default=True)
    joined_at  = Column(DateTime,    default=datetime.utcnow)


class SavedChart(Base):
    """History of AI-generated charts (mirrors the info saved in sql_ai.db)."""
    __tablename__ = "saved_charts"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id    = Column(Integer, nullable=True)          # FK placeholder (optional for now)
    title      = Column(String(200), nullable=False)
    chart_type = Column(String(40),  nullable=False)
    color      = Column(String(20),  default="#6366f1")
    sql_query  = Column(Text,        nullable=False)
    x_key      = Column(String(100), nullable=False)
    y_key      = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SavedTable(Base):
    """
    Lightweight record of tables the user has created in the analytical DB.
    Useful for quick stats without reflecting the full sql_ai.db schema.
    """
    __tablename__ = "saved_tables"

    id           = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id      = Column(Integer, nullable=True)
    table_name   = Column(String(200), nullable=False)
    row_count    = Column(Integer,     default=0)
    col_count    = Column(Integer,     default=0)
    created_at   = Column(DateTime,    default=datetime.utcnow)
    last_updated = Column(DateTime,    default=datetime.utcnow, onupdate=datetime.utcnow)


# ── Create all tables on import ───────────────────────────────────────────────
def init_app_db():
    Base.metadata.create_all(bind=engine)


init_app_db()
