from fastapi import APIRouter
from schemas.fault_schema import FaultInput,FaultPrediction
from services.fault_service import predict_fault

router = APIRouter(
    prefix="/fault",
    tags=["Fault Detection"]
)

@router.post(
    "/predict",response_model=FaultPrediction
)

def predict_fault_api(data: FaultInput):
    """
    Predict the vehicle fault using the trained Random Forest model.
    """

    result = predict_fault(data)

    return result