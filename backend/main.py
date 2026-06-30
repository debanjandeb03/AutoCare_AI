from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.engine import router as engine_router
from routes.battery import router as battery_router
from routes.fault import router as fault_router

app = FastAPI(title="AutoCare AI Backend",version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # We'll restrict this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(engine_router)
app.include_router(battery_router)
app.include_router(fault_router)

@app.get("/")
def home():
    return {
        "status":"Welcome to AutoCare AI backend"
    }

@app.get("/health")
def health():
    return {
        "status": "Backend is running succesfully"
    }


