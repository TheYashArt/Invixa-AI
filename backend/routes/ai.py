from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import create_engine, text, MetaData
import ollama
from fastapi import FastAPI, HTTPException

router = APIRouter()


# 1. Database Setup (using SQLite for this example)
DB_URL = "sqlite:///sql_ai.db"
engine = create_engine(DB_URL)
metadata = MetaData()

class QueryRequest(BaseModel):
    prompt: str

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
        response = ollama.chat(model='deepseek-v3.1:671b-cloud', messages=[
            {'role': 'system', 'content': system_instruction},
            {'role': 'user', 'content': request.prompt},
        ])
        
        generated_text = response['message']['content'].strip()

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
        explaination = ollama.chat(model="deepseek-v3.1:671b-cloud", messages=[
            {'role': "user", 'content': f"Briefly explain what this SQL does in plain English: {generated_sql}"}
        ])
        
        # F. Execute via SQLAlchemy
        with engine.connect() as connection:
            result = connection.execute(text(generated_sql))
            connection.commit()
            
            if result.returns_rows:
                content = [dict(row) for row in result.mappings()]
                message = "Data fetched successfully"
            else:
                content = {
                    "message": "Action completed successfully",
                    "rows_affected": result.rowcount
                }
                message = "Database updated successfully"
            
            return {
                "status": "success",
                "executed_sql": generated_sql,
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