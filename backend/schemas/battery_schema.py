from pydantic import BaseModel, Field


class BatteryInput(BaseModel):
    voltage: float = Field(...,description="Battery voltage in Volts")

    cycles: int = Field(...,description="Number of charging cycles")

    current_draw: float = Field(...,description="Current draw in Amperes")

    temperature: float = Field(...,description="Battery operating temperature in °C")

class BatteryPrediction(BaseModel):
    health_score: float
    risk: str
    recommendation: str