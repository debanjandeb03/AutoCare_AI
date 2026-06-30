import os
import pickle
import pandas as pd

# Load the trained Battery Health model
model_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "battery_health_model.pkl"
)

with open(model_path, "rb") as f:
    battery_model = pickle.load(f)


def predict_battery_health(data):
    """
    Predict battery health using the trained Random Forest Regressor.
    """

    battery_input = pd.DataFrame({
        "Battery_voltage": [data.voltage],
        "Operating_Temperature": [data.temperature],
        "Charging_Cycles": [data.cycles],
        "Current_draw": [data.current_draw]
    })

    health_score = round(
        float(battery_model.predict(battery_input)[0]),
        2
    )

    health_score = max(0, min(100, health_score))

    if health_score >= 80:
        risk = "Low"
    elif health_score >= 50:
        risk = "Medium"
    else:
        risk = "High"

    if health_score >= 80:
        recommendation = "Battery is healthy. No maintenance required."

    elif health_score >= 50:
        recommendation = "Battery health is degrading. Monitor performance."

    else:
        recommendation = "Battery replacement recommended."

    return {
        "health_score": health_score,
        "risk": risk,
        "recommendation": recommendation
    }