import pandas as pd

def clean_data(data: dict):
    """
    Clean and standardize patient data.
    """
    df = pd.DataFrame([data])
    
    # Example: Fill missing values
    df.fillna(value={"age": df["age"].mean(), "gender": "unknown"}, inplace=True)
    
    # Normalize numerical columns
    if "age" in df.columns:
        df["age"] = (df["age"] - df["age"].mean()) / df["age"].std()
    
    return df.to_dict(orient="records")[0]