from pydantic import BaseModel,Field

class FaultInput(BaseModel):
    vibration: float = Field(...,description="Vibration amplitude")
    rpm: float = Field(...,description="Engine RPM")
    speed: float = Field(...,description="Vehicle speed in km/h")


class FaultPrediction(BaseModel):
    fault_type:str
    severity: str
    action: str
