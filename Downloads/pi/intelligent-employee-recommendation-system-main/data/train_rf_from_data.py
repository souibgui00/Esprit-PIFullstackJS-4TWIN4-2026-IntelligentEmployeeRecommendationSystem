import os
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.utils import resample
import joblib

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.xlsx"
OUTPUT_DIR = BASE_DIR.parent / "nlp-service"

CATEGORICAL_COLUMNS = [
    "Attrition",
    "BusinessTravel",
    "Department",
    "EducationField",
    "Gender",
    "JobRole",
    "MaritalStatus",
    "statut",
    "competences",
]

REQUIRED_COLUMNS = [
    "Attrition",
    "PerformanceRating",
] + CATEGORICAL_COLUMNS

if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

print(f"Loading dataset from {DATASET_PATH}")
df = pd.read_excel(DATASET_PATH)
print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
print("Columns:", df.columns.tolist())

missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
if missing:
    raise ValueError(
        "The dataset is missing required columns.\n"
        f"Missing columns: {missing}\n"
        "Please update CATEGORICAL_COLUMNS or the dataset to match your schema."
    )

# Remove common non-useful columns if they exist.
for col in ["id", "email"]:
    if col in df.columns:
        df = df.drop(columns=[col])

label_encoders = {}
for col in CATEGORICAL_COLUMNS:
    if col not in df.columns:
        continue
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le

# Define target label for a "good candidate".
# Change this logic if your dataset uses a different definition.
if "Attrition" in label_encoders:
    attrition_no = label_encoders["Attrition"].transform(["No"])[0]
    attrition_mask = df["Attrition"] == attrition_no
else:
    attrition_mask = df["Attrition"] == "No"

df["good_candidate"] = (
    attrition_mask & (df["PerformanceRating"] >= 3)
).astype(int)

print("Target distribution:")
print(df["good_candidate"].value_counts())

X = df.drop(columns=["good_candidate", "Attrition"])
y = df["good_candidate"]

print(f"Using {X.shape[1]} features")
print(X.columns.tolist())

# Balance the dataset by oversampling the minority class
if y.value_counts().min() != y.value_counts().max():
    df_majority = df[df["good_candidate"] == 0]
    df_minority = df[df["good_candidate"] == 1]
    df_minority_upsampled = resample(
        df_minority,
        replace=True,
        n_samples=len(df_majority),
        random_state=42,
    )
    df_balanced = pd.concat([df_majority, df_minority_upsampled])
    X = df_balanced.drop(columns=["good_candidate", "Attrition"])
    y = df_balanced["good_candidate"]
    print(f"Balanced dataset shape: {X.shape}")
    print(y.value_counts())
else:
    print("Dataset already balanced")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

print(f"Train shape: {X_train.shape}, Test shape: {X_test.shape}")

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

print("Training complete")

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred, target_names=["Not Recommended", "Recommended"]))
print("ROC AUC:", roc_auc_score(y_test, y_prob))
print("Cross-val accuracy:", cross_val_score(model, X, y, cv=5, scoring="accuracy").mean())

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
joblib.dump(model, OUTPUT_DIR / "rf_model_v2.pkl")
joblib.dump(label_encoders, OUTPUT_DIR / "label_encoders_v2.pkl")
with open(OUTPUT_DIR / "feature_names_v2.json", "w", encoding="utf-8") as f:
    json.dump(X_train.columns.tolist(), f, indent=2)

print("Saved artifacts to", OUTPUT_DIR)
print("  - rf_model_v2.pkl")
print("  - label_encoders_v2.pkl")
print("  - feature_names_v2.json")
