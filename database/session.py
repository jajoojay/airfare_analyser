"""Database engine and session management with PostgreSQL primary and SQLite fallback."""

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from packages.shared.config import settings

logger = logging.getLogger(__name__)

# Determine active database URL
db_url = settings.DATABASE_URL

# Connect to database with resilient fallback
try:
    engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=3600, echo=False)
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to primary PostgreSQL database.")
except Exception as e:
    logger.warning(
        f"Could not connect to PostgreSQL at {db_url} ({e}). Falling back to local SQLite engine for development."
    )
    fallback_url = "sqlite:///./airfare_observatory.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=False)
    logger.info(f"Initialized fallback SQLite engine at {fallback_url}.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI Dependency providing a transactional database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
