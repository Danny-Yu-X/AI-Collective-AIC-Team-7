# RFModel.py

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_curve,
    auc
)

# -----------------------------
# 1. LOAD DATASET
# -----------------------------

# CHANGE THIS VARIABLE FOR EACH STOCK (e.g., "AMZN", "AAPL", "TSLA")
stock_symbol = "AMZN" 

# Dynamically loads the correct CSV based on the symbol
dataset_name = f"{stock_symbol}_data.csv"
data = pd.read_csv(dataset_name)

print(f"Dataset {dataset_name} loaded successfully!")
print(data.head())


# -----------------------------
# 2. DATA CLEANING
# -----------------------------

# Convert Target:
# -1 -> 0 (DOWN)
#  1 -> 1 (UP)
data['Target'] = data['Target'].replace(-1, 0)

# Remove missing values
data = data.dropna()

# Convert Date column to datetime
data['Date'] = pd.to_datetime(data['Date'])

# Sort chronologically (important for time series)
data = data.sort_values(by='Date')


# -----------------------------
# 3. FEATURE SELECTION
# -----------------------------

# INPUT FEATURES (X)
features = ['Close', 'Volume', 'High', 'Low', 'Open']
X = data[features]

# OUTPUT LABEL (Y)
# 1 = UP
# 0 = DOWN
y = data['Target']


# -----------------------------
# 4. TRAIN-TEST SPLIT
# -----------------------------

# 80% Training Data, 20% Testing Data
# shuffle=False because stock data is sequential
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False
)


# -----------------------------
# 5. FEATURE SCALING
# -----------------------------

scaler = StandardScaler()

# Fit on training data, then transform both train and test
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


# -----------------------------
# 6. TRAIN RANDOM FOREST MODEL
# -----------------------------

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train_scaled, y_train)
print(f"Random Forest Model for {stock_symbol} trained successfully!")


# -----------------------------
# 7. SAVE MODEL + SCALER
# -----------------------------

# Saves trained model and scaler to file dynamically
joblib.dump(model, f"rf_model_{stock_symbol}.pkl")
joblib.dump(scaler, f"scaler_{stock_symbol}.pkl")

print(f"Successfully saved models for {stock_symbol}!")


# -----------------------------
# 8. MODEL EVALUATION
# -----------------------------

y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nAccuracy for {stock_symbol}: {accuracy * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))


# -----------------------------
# 9. CONFUSION MATRIX
# -----------------------------

cm = confusion_matrix(y_test, y_pred)

fig_cm, ax_cm = plt.subplots(figsize=(6, 4))
sns.heatmap(
    cm, 
    annot=True, 
    fmt='d', 
    cmap='Blues',
    xticklabels=['DOWN (0)', 'UP (1)'],
    yticklabels=['DOWN (0)', 'UP (1)'],
    ax=ax_cm
)

ax_cm.set_title(
    f'Random Forest Confusion Matrix - {stock_symbol}',
    fontsize=14,
    fontweight='bold'
)
ax_cm.set_xlabel('Predicted Label', fontsize=12)
ax_cm.set_ylabel('True Label', fontsize=12)
plt.tight_layout()

# Save confusion matrix image
fig_cm.savefig(f"{stock_symbol}_RFConfusionMatrix.png", dpi=150)
# plt.show() # Uncomment if you want the popup window to show


# -----------------------------
# 10. ROC-AUC CURVE
# -----------------------------

# Probability scores for UP class
y_prob = model.predict_proba(X_test_scaled)[:, 1]

# Compute ROC curve
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
roc_auc = auc(fpr, tpr)

fig_roc, ax_roc = plt.subplots(figsize=(7, 5))
ax_roc.plot(
    fpr, tpr, color='steelblue', lw=2,
    label=f'ROC Curve (AUC = {roc_auc:.4f})'
)

# Random baseline
ax_roc.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--', label='Random Classifier')
ax_roc.set_xlim([0.0, 1.0])
ax_roc.set_ylim([0.0, 1.05])
ax_roc.set_xlabel('False Positive Rate')
ax_roc.set_ylabel('True Positive Rate')
ax_roc.set_title(f'ROC Curve - {stock_symbol}')
ax_roc.legend(loc="lower right")

# Save ROC curve image
fig_roc.savefig(f"{stock_symbol}_RF_ROC_AUC_Curve.png", dpi=150)
# plt.show() # Uncomment if you want the popup window to show