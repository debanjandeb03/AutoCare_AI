import os
import pickle 
import pandas as pd

model_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "vibration_fault_detection_model.pkl"
)

with open(model_path, "rb") as f:
    fault_model = pickle.load(f)

# Load label encoder
encoder_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "vibration_model_label_encoder.pkl"
)

with open(encoder_path, "rb") as f:
    label_encoder = pickle.load(f)


def predict_fault(data):

    vibration = data.vibration

    # Approximate statistical features
    fault_input = pd.DataFrame({
        "mean": [vibration],
        "std": [vibration * 0.10],
        "rms": [vibration],
        "peak": [vibration * 1.5],
        "skewness": [0],
        "kurtosis": [3],
        "rpm": [data.rpm]
    })

    prediction = fault_model.predict(fault_input)[0]

    fault_type = label_encoder.inverse_transform([prediction])[0]

    severity_map = {
        "Normal": "NONE",
        "Ball_Fault": "MODERATE",
        "Inner_Race_Fault": "SEVERE",
        "Outer_Race_Fault": "CRITICAL"
    }

    action_map = {
        "Normal": "No action required.",
        "Ball_Fault": "Inspect rolling element bearings.",
        "Inner_Race_Fault": "Replace bearing immediately.",
        "Outer_Race_Fault": "Stop vehicle and perform maintenance."
    }

    return {
        "fault_type": fault_type,
        "severity": severity_map.get(fault_type, "UNKNOWN"),
        "action": action_map.get(
            fault_type,
            "Further inspection required."
        )
    }