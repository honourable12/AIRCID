import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
from sklearn.preprocessing import LabelEncoder

# Define the path to the models directory inside app
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")  # Adjusted path to point to app/models
os.makedirs(MODEL_DIR, exist_ok=True)  # Ensure the directory exists

# Load the dataset
file_path = os.path.join(os.path.dirname(__file__), "../data/dataset.csv")  # Adjusted path to point to data/
print(f"Loading dataset from: {file_path}")
data = pd.read_csv(file_path)

# Identify categorical columns
categorical_columns = data.select_dtypes(include=["object"]).columns

# Encode categorical columns using Label Encoding
for col in categorical_columns:
    label_encoder = LabelEncoder()
    data[col] = label_encoder.fit_transform(data[col])

# Define features (X) and target (y)
X = data.drop(columns=["Diagnosis"])  # Drop the target column
y = data["Diagnosis"]  # Target column

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# Train a Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the trained model
MODEL_PATH = os.path.join(MODEL_DIR, "case_matching_model.pkl")
joblib.dump(model, MODEL_PATH)
print(f"Model trained and saved to {MODEL_PATH}")