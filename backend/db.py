import sqlite3
import os
import json
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "basis_cache.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


def get_cached(key: str):
    with get_db() as conn:
        row = conn.execute("SELECT data FROM cache WHERE key = ?", (key,)).fetchone()
        if row:
            return json.loads(row["data"])
    return None


def set_cached(key: str, data):
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO cache (key, data) VALUES (?, ?)",
            (key, json.dumps(data)),
        )


init_db()
