from fastapi import APIRouter
from schemas.battery_schema import BatteryInput,BatteryPrediction
from services.battery_service import predict_battery_health

router = APIRouter(
    prefix="/battery",
    tags=["Battery Health"]
)

@router.post("/predict",response_model=BatteryPrediction)
def predict_battery(data:BatteryInput):
    """
    Predict battery health using the trained ML model.
    """

    result = predict_battery_health(data)

    return result