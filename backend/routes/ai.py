from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, text, MetaData
from groq import Groq
from datetime import datetime
import os

from app_db_models import SessionLocal, SavedTable

router = APIRouter()


# 1. Database Setup (using SQLite for this example)
DB_URL = "sqlite:///sql_ai.db"
engine = create_engine(DB_URL)
metadata = MetaData()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
MODEL_NAME = "llama-3.3-70b-versatile"

from typing import Optional

class QueryRequest(BaseModel):
    prompt: str
    user_id: Optional[int] = None


def sync_tables_to_app_db(user_id: int = None):
    """
    Reflect all tables from sql_ai.db and upsert their metadata
    into app.db's SavedTable records, keeping stats in sync.
    """
    try:
        fresh_meta = MetaData()
        fresh_meta.reflect(bind=engine)
        db = SessionLocal()
        with engine.connect() as conn:
            for table_name, table_obj in fresh_meta.tables.items():
                # Skip internal tables
                if table_name == "saved_charts":
                    continue
                row_count = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar() or 0
                col_count = len(table_obj.columns)

                existing = db.query(SavedTable).filter(SavedTable.table_name == table_name).first()
                if existing:
                    existing.row_count = row_count
                    existing.col_count = col_count
                    existing.last_updated = datetime.utcnow()
                    if user_id and not existing.user_id:
                        existing.user_id = user_id
                else:
                    db.add(SavedTable(
                        user_id=user_id,
                        table_name=table_name,
                        row_count=row_count,
                        col_count=col_count,
                    ))

        # Remove app.db records for tables that no longer exist in sql_ai.db
        live_names = {t for t in fresh_meta.tables if t != "saved_charts"}
        stale = db.query(SavedTable).filter(SavedTable.table_name.notin_(live_names)).all()
        for s in stale:
            db.delete(s)

        db.commit()
        db.close()
    except Exception as e:
        print("sync_tables_to_app_db error:", e)

def get_current_schema():
    """Reflects the DB to get current table structures for the AI context."""
    metadata.reflect(bind=engine)
    schema_info = ""
    for table_name, table in metadata.tables.items():
        columns = ", ".join([f"{col.name} ({col.type})" for col in table.columns])
        schema_info += f"Table {table_name}: {columns}\n"
    return schema_info if schema_info else "The database is currently empty."


def is_sql(text: str) -> bool:
    """Return True if the text looks like a SQL statement rather than plain prose."""
    SQL_KEYWORDS = (
        "SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP",
        "ALTER", "TRUNCATE", "REPLACE", "WITH", "PRAGMA",
    )
    first_word = text.strip().split()[0].upper() if text.strip() else ""
    return first_word in SQL_KEYWORDS

@router.post("/generate-sql")
async def handle_sql_request(request: QueryRequest):
    # A. Get current DB context
    current_schema = get_current_schema()
    
    # B. Construct the System Prompt
    system_instruction = f"""
    You are a SQL expert. Given the following database schema:
    {current_schema}
    
    Convert the user's request into a valid SQL query. 
    - If they ask to create a table, use 'CREATE TABLE' and add a column id with autogeneraetd id's.
    - If they ask to add data, use 'INSERT'.
    - If they ask to update data, use 'UPDATE'.
    - If they ask to delete data, use 'DELETE'.
    - If they ask to drop a table, use 'DROP TABLE'.
    - If they Greets only greet them back dont overthink and just ask them if they need any help with the database.
    - Generate sql queries that are compatible with SQLite only.
    - ONLY return the raw SQL code. No explanations, no markdown backticks.
    """

    try:
        # C. Call Local Ollama
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_instruction},
                {'role': 'user', 'content': request.prompt},
            ]
        )
        
        generated_text = response.choices[0].message.content.strip()

        # D. If the LLM returned plain text (greeting, explanation, etc.) — don't execute it
        if not is_sql(generated_text):
            return {
                "status": "chat",
                "executed_sql": None,
                "message": "No SQL executed",
                "explanation": generated_text,
                "content": []
            }

        generated_sql = generated_text

        # E. Get an explanation of the SQL from the LLM
        explaination = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': "user", 'content': f"Briefly explain what this SQL does in plain English: {generated_sql}"}
            ]
        )
        
        # Split into individual statements (use a different loop var to avoid shadowing)
        queries = [q.strip() for q in generated_sql.split(';') if q.strip()]
        
        # F. Execute ALL queries via SQLAlchemy in a single connection
        all_content = []
        executed_queries = []
        message = "Database updated successfully"
        had_mutation = False
        
        with engine.connect() as connection:
            for query in queries:
                result = connection.execute(text(query))
                executed_queries.append(query)
                
                if result.returns_rows:
                    rows = [dict(row) for row in result.mappings()]
                    all_content.extend(rows)
                    message = "Data fetched successfully"
                else:
                    had_mutation = True
            
            # Commit once after all queries
            connection.commit()
        
        # Sync table metadata to app.db after any mutation
        if had_mutation:
            sync_tables_to_app_db(user_id=request.user_id)
        
        # Build the final content
        if len(all_content) > 0:
            content = all_content
        else:
            content = {
                "message": f"Action completed successfully — {len(queries)} statement(s) executed",
                "rows_affected": len(queries)
            }
        
        return {
            "status": "success",
            "executed_sql": ";\n".join(executed_queries),
            "message": message,
            "explanation": explaination['message']['content'].strip(),
            "content": content
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── New endpoints for the real-time Database Preview ──────────────────

@router.get("/db/tables")
def get_tables():
    """Return a list of all tables with their row counts."""
    try:
        fresh_meta = MetaData()
        fresh_meta.reflect(bind=engine)
        result = []
        with engine.connect() as conn:
            for table_name in fresh_meta.tables:
                row_count = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
                col_count = len(fresh_meta.tables[table_name].columns)
                result.append({"name": table_name, "row_count": row_count, "col_count": col_count})
        return {"tables": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/db/table/{table_name}")
def get_table_data(table_name: str):
    """Return columns + all rows for a specific table."""
    try:
        fresh_meta = MetaData()
        fresh_meta.reflect(bind=engine)
        if table_name not in fresh_meta.tables:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
        with engine.connect() as conn:
            result = conn.execute(text(f'SELECT * FROM "{table_name}"'))
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return {"table": table_name, "columns": columns, "rows": rows, "row_count": len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))