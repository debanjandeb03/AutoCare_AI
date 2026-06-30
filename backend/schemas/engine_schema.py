from pydantic import BaseModel,Field

class EngineInput(BaseModel):
    air_temperature: float = Field(..., description="Air temperature in Kelvin")
    process_temperature: float = Field(..., description="Process temperature in Kelvin")
    rotational_speed: float = Field(..., description="Rotational speed in RPM")
    torque: float = Field(..., description="Torque in Nm")
    tool_wear: float = Field(..., description="Tool wear in minutes")

class EnginePrediction(BaseModel):
    health_score: float
    failure_risk: str
    prediction: str