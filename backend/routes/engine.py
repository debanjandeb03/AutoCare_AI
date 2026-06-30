from fastapi import APIRouter
from schemas.engine_schema import EngineInput,EnginePrediction
from services.engine_service import predict_engine_health

router = APIRouter(
    prefix="/engine",
    tags=["Engine Health"]
)

@router.post("/predict",response_model=EnginePrediction)
def predict_engine(data: EngineInput):
    """
    Predict the engine health using the trained Random Forest model.
    """
    result = predict_engine_health(data)
    return result