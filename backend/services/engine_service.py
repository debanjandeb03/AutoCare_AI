import os
import pickle
import pandas as pd

#Load the trained model
model_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "engine_health_rf.pkl"
)

with open(model_path,"rb") as f:
    engine_model = pickle.load(f)


def predict_engine_health(data):
    #creating the dataframe as same as the model's input
    engine_input = pd.DataFrame({
        "Air temperature [K]": [data.air_temperature],
        "Process temperature [K]": [data.process_temperature],
        "Rotational speed [rpm]": [data.rotational_speed],
        "Torque [Nm]": [data.torque],
        "Tool wear [min]": [data.tool_wear]
    })

    prediction = int(engine_model.predict(engine_input)[0])

    #Failure Probability
    failure_probability =  float(engine_model.predict_proba(engine_input)[0][1])

    #Health Score 
    health_score = round((1-failure_probability)*100,2)

    #Risk Level
    if failure_probability < 0.30:
        risk = "Low"

    elif failure_probability < 0.70:
        risk = "Medium"

    else:
        risk = "High"

    return {
        "prediction":prediction,
        "failure_probability":round((failure_probability*100),2),
        "health-score":health_score,
        "risk":risk
    }
