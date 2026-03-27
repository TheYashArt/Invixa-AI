# SQL AI

SQL AI is a local full-stack app that lets you manage a SQLite database and generate charts using natural-language prompts.

The project includes:

- A React + Vite frontend
- A FastAPI backend
- SQLite for storage
- Ollama for SQL and chart generation

## Features

- Create, update, query, and delete SQLite data using plain English
- Preview tables and rows in real time
- Generate charts from database prompts
- Save recently generated chart configs and reload them in the UI

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: FastAPI, SQLAlchemy, Uvicorn
- AI runtime: Ollama
- Database: SQLite

## Project Structure

```text
sql-ai/
|-- src/                  # React frontend
|-- public/               # Static assets
|-- backend/
|   |-- main.py           # FastAPI app entry point
|   |-- requirements.txt  # Python dependencies
|   |-- routes/
|   |   |-- ai.py         # Natural-language to SQL endpoints
|   |   `-- graph.py      # Natural-language to chart endpoints
|   `-- sql_ai.db         # SQLite database used by the backend
|-- package.json
`-- README.md
```

## Prerequisites

Install these before starting:

- Node.js and npm
- Python 3.10+
- Ollama

The backend currently calls the Ollama model `deepseek-v3.1:671b-cloud` in both [backend/routes/ai.py](backend/routes/ai.py) and [backend/routes/graph.py](backend/routes/graph.py). Make sure that model is available in your Ollama setup, or change the model name in those files before running the app.

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd sql-ai
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Create a Python virtual environment

PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Start Ollama

Make sure Ollama is running before you start the backend.

If Ollama is not already running in the background, start it with:

```bash
ollama serve
```

If you use a different Ollama model than the one hardcoded in the project, update both backend route files first.

## Running the Project

Open two terminals.

### Terminal 1: Start the backend

From the `backend` folder:

PowerShell:

```powershell
.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux:

```bash
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend enables CORS for the Vite dev server on `http://localhost:5173`.

### Terminal 2: Start the frontend

From the project root:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

## Important Setup Notes

- The frontend uses a hardcoded API base URL of `http://localhost:8000`.
- Start the FastAPI server on port `8000`, or update the frontend components if you want a different backend URL.
- Run the backend from the `backend` directory so SQLite resolves to `backend/sql_ai.db`.
- If you start Uvicorn from a different folder, a different `sql_ai.db` file may be created.
- Analytics will fail on an empty database until you create tables and insert some data.

## How to Use

1. Start the backend and frontend.
2. Open the app in your browser.
3. Use the `Database` tab to create tables, insert rows, and run natural-language database actions.
4. Use the `Analytics` tab to ask for charts such as monthly sales, user counts, or category breakdowns.
5. Use the `Settings` tab to view recently saved chart history.

## API Endpoints

- `POST /generate-sql` - Convert a prompt into SQL and execute it
- `GET /db/tables` - List database tables with row counts
- `GET /db/table/{table_name}` - Preview a table's columns and rows
- `POST /generate-graph` - Generate chart metadata and query data
- `GET /saved-graphs` - Return recently saved charts

## Troubleshooting

### Frontend cannot connect to the backend

- Confirm the backend is running on `http://localhost:8000`
- Confirm the frontend is running on `http://localhost:5173`
- Check that Ollama is running, because backend requests depend on it

### The model request fails

- Verify the model name in [backend/routes/ai.py](backend/routes/ai.py) and [backend/routes/graph.py](backend/routes/graph.py)
- Make sure your Ollama installation can access that model

### Charts return no data

- Create tables and insert data first
- Make sure your prompt matches the actual table and column names in SQLite

## Development Notes

- Frontend dev server: `localhost:5173`
- Backend API server: `localhost:8000`
- Database: SQLite file at `backend/sql_ai.db` when started from the backend folder
- There is currently no `.env` configuration layer; most local settings are hardcoded in the source

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for the full text.
