"""
graph.py  –  POST /generate-graph
──────────────────────────────────
How it works (end-to-end):

1.  Frontend sends { prompt: "show me revenue by month" }
2.  We reflect the live SQLite schema so the LLM knows every table + column.
3.  We also snapshot up to 5 rows per table so the LLM understands data shape.
4.  The carefully-engineered system prompt asks the LLM to return *only* a
    strict JSON object — no prose, no markdown fences.
5.  We parse that JSON, validate that every required field is present, and
    run the embedded SQL query against the real database.
6.  The query result is attached as `data` and returned to the frontend.
7.  The frontend picks the right Recharts component based on `chart_type` and
    renders the chart directly from `data`.

Edge cases handled
──────────────────
• Empty database          → friendly error before calling LLM.
• LLM wraps JSON in ```  → we strip markdown fences before parsing.
• LLM returns plain text  → JSON parse fails → 422 with clear message.
• Missing required fields → validated before DB call.
• SQL query fails          → caught; the raw SQL is returned for debugging.
• Query returns 0 rows    → chart rendered with empty data array + warning.
• Numeric strings          → coerced to float so Recharts can plot them.
• Ambiguous chart type     → LLM constrained to a fixed enum.
"""

import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, text, MetaData
from groq import Groq
import os

from app_db_models import SessionLocal, SavedChart as AppSavedChart

router = APIRouter()

DB_URL = "sqlite:///sql_ai.db"
engine = create_engine(DB_URL)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_NAME = "llama-3.3-70b-versatile"

def init_db():
    """No-op — charts are now stored in app.db, not sql_ai.db."""
    pass


# ── helpers ───────────────────────────────────────────────────────────────────

def get_schema_and_sample() -> str:
    """Return schema info PLUS up to 5 sample rows per table."""
    meta = MetaData()
    meta.reflect(bind=engine)
    if not meta.tables:
        return ""

    parts = []
    with engine.connect() as conn:
        for table_name, table in meta.tables.items():
            cols = ", ".join(f"{c.name} ({c.type})" for c in table.columns)
            parts.append(f"Table `{table_name}`: {cols}")
            try:
                rows = conn.execute(text(f'SELECT * FROM "{table_name}" LIMIT 5')).fetchall()
                if rows:
                    keys = [c.name for c in table.columns]
                    sample_lines = [str(dict(zip(keys, r))) for r in rows]
                    parts.append("  Sample rows: " + " | ".join(sample_lines))
            except Exception:
                pass
    return "\n".join(parts)


def strip_markdown_fences(raw: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` wrappers the LLM loves to add."""
    raw = raw.strip()
    raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    return raw.strip()


def coerce_numeric(data: list[dict], value_key: str) -> list[dict]:
    """Try to cast the value field to float so Recharts can plot it."""
    for row in data:
        if value_key in row:
            try:
                row[value_key] = float(row[value_key])
            except (TypeError, ValueError):
                pass
    return data


# ── request model ─────────────────────────────────────────────────────────────

from typing import Optional

class GraphRequest(BaseModel):
    prompt: str
    user_id: Optional[int] = None


# ── system prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """
You are a data-visualisation expert with deep SQL knowledge.
You have access to this SQLite database:

{schema}

The user will describe a chart they want. Your job is to:
1. Write a SELECT query that fetches exactly the data needed for the chart.
2. Decide the best chart type from this fixed list:
   bar | line | area | pie | scatter | composed
3. Return ONLY a single valid JSON object — no prose, no markdown fences, no
   comments, no extra keys.

Required JSON shape:
{{
  "chart_type": "<one of: bar | line | area | pie | scatter | composed>",
  "title": "<short human-readable chart title>",
  "description": "<one sentence explaining what insight this chart shows>",
  "sql": "<SQLite SELECT query — no semicolons, no backticks, single-line>",
  "x_key": "<column name to use on X-axis / category axis>",
  "y_key": "<column name to use for the primary numeric value>",
  "color": "<a hex colour that fits the chart mood, e.g. #6366f1>",
  "x_label": "<human label for X axis>",
  "y_label": "<human label for Y axis>"
}}

Rules & edge-case handling:
- For PIE charts: x_key = category label, y_key = numeric value (renamed to 'value' in SQL using AS).
- For SCATTER charts: x_key and y_key must both be numeric columns.
- For COMPOSED charts: still pick one primary x_key and y_key; the frontend handles the rest.
- If the user asks for something the schema cannot support, set chart_type to "bar",
  write `SELECT 'No data available' AS label, 0 AS count` as sql,
  and set description to a clear explanation of why.
- NEVER use table or column names that don't exist in the schema above.
- NEVER add a semicolon at the end of the SQL.
- NEVER wrap the JSON in markdown code fences.
- If aggregation is needed (SUM, COUNT, AVG), always add GROUP BY.
- Alias computed columns with a clean name (e.g. SUM(price) AS total_revenue).
- Choose the y_key from the actual alias used in the SELECT.
- Limit result rows to at most 50 unless the user explicitly asks for more.
"""


# ── endpoint ──────────────────────────────────────────────────────────────────

@router.post("/generate-graph")
async def generate_graph(request: GraphRequest):
    # Step 1: Get live schema + samples
    schema = get_schema_and_sample()
    if not schema:
        raise HTTPException(
            status_code=422,
            detail="The database is empty. Create some tables first using the Database chatbot."
        )

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(schema=schema)

    try:
        # Step 2: Ask the LLM for a chart spec
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": request.prompt},
            ],
            response_format={"type": "json_object"}
        )

        raw = response.choices[0].message.content.strip()

        # Step 3: Strip markdown fences if present
        clean = strip_markdown_fences(raw)

        # Step 4: Parse JSON — raises ValueError if LLM returned prose
        try:
            spec = json.loads(clean)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=422,
                detail=f"LLM did not return valid JSON. Raw response: {raw[:300]}. Parse error: {e}"
            )

        # Step 5: Validate required fields
        required = ["chart_type", "title", "sql", "x_key", "y_key"]
        missing = [f for f in required if f not in spec or not spec[f]]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"LLM response is missing required fields: {missing}. Raw: {clean[:300]}"
            )

        # Step 6: Constrain chart_type to known values
        allowed_types = {"bar", "line", "area", "pie", "scatter", "composed"}
        if spec["chart_type"] not in allowed_types:
            spec["chart_type"] = "bar"  # safe fallback

        # Step 7: Execute the SQL query
        sql_query = spec["sql"].strip().rstrip(";")
        try:
            with engine.connect() as conn:
                result = conn.execute(text(sql_query))
                rows = [dict(zip(result.keys(), row)) for row in result.fetchall()]
        except Exception as sql_err:
            raise HTTPException(
                status_code=500,
                detail=f"SQL execution failed: {sql_err}. Query was: {sql_query}"
            )

        # Step 8: Coerce numeric values so Recharts can plot them
        rows = coerce_numeric(rows, spec["y_key"])

        # Step 9: Warn if no data
        warning = None
        if not rows:
            warning = "The query returned no rows. Try inserting some data first."

        # Step 10: Save chart to app.db only
        try:
            db = SessionLocal()
            app_chart = AppSavedChart(
                user_id=request.user_id,
                title=spec.get("title", "Chart"),
                chart_type=spec["chart_type"],
                color=spec.get("color", "#6366f1"),
                sql_query=sql_query,
                x_key=spec["x_key"],
                y_key=spec["y_key"],
            )
            db.add(app_chart)
            db.commit()
            db.close()
        except Exception as save_err:
            print("Failed to save chart history to app.db:", save_err)

        return {
            "status": "success",
            "chart_type":   spec["chart_type"],
            "title":        spec.get("title", "Chart"),
            "description":  spec.get("description", ""),
            "x_key":        spec["x_key"],
            "y_key":        spec["y_key"],
            "color":        spec.get("color", "#6366f1"),
            "x_label":      spec.get("x_label", spec["x_key"]),
            "y_label":      spec.get("y_label", spec["y_key"]),
            "executed_sql": sql_query,
            "data":         rows,
            "row_count":    len(rows),
            "warning":      warning,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved-graphs")
async def get_saved_graphs():
    """Read chart history from app.db, re-run SQL against sql_ai.db for live data."""
    try:
        db = SessionLocal()
        records = db.query(AppSavedChart).order_by(AppSavedChart.created_at.desc()).limit(6).all()
        results = []
        with engine.connect() as conn:
            for rec in records:
                chart_data = []
                try:
                    data_res = conn.execute(text(rec.sql_query))
                    raw_rows = [dict(zip(data_res.keys(), row)) for row in data_res.fetchall()]
                    chart_data = coerce_numeric(raw_rows, rec.y_key)
                except Exception:
                    pass

                results.append({
                    "id": rec.id,
                    "title": rec.title,
                    "type": rec.chart_type,
                    "color": rec.color,
                    "date": rec.created_at.isoformat() if rec.created_at else "",
                    "data": chart_data,
                    "x_key": rec.x_key,
                    "y_key": rec.y_key,
                })
        db.close()
        return {"charts": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

