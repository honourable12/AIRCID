import os
import pandas as pd
import joblib

# Load the pre-trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/case_matching_model.pkl")
model = joblib.load(MODEL_PATH)

def match_case(input_data: dict):
    """
    Predict eligibility for a given patient.
    """
    # Convert input data to DataFrame
    input_df = pd.DataFrame([input_data])

    # Ensure the input data matches the model's expected format
    # (e.g., drop unnecessary columns or fill missing values)
    # Example: Drop irrelevant columns
    input_df = input_df.drop(columns=["patient_id"], errors="ignore")

    # Predict eligibility
    prediction = model.predict(input_df)
    return {"eligible": bool(prediction[0])}