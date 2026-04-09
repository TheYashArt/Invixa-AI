from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ai, graph, app_db

# import ollama

app = FastAPI()

origins = [
    "https://invixa-ai-qjia.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router)
app.include_router(graph.router)
app.include_router(app_db.router)