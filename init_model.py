#=======================================================================================================================================#
# Our baseline ML model we will implement is: Logistic Regression Classifier - Danny and Kel

# Overall Plan - Danny and Kel:
  # Input:
    # Cleaned dataset (CSV from data team)
      # Close == stock price
      # Volume == trading activity
      # Target == our label (DOWN: 0, UP: 1)

  # Plan for our initial model:
  # Load dataset
  # Create features (X)
  # Extract labels (y)
  # Train model
  # Evaluate model
  # Prediction function for frontend later

  # Potential Output:
  # Accuracy score
  # Predictions (UP/DOWN)
  # Visuals of ROC curve and confusion matrix
  # A function we can call later from frontend/backend
#=======================================================================================================================================#
# Our imports
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.metrics import roc_curve, auc, ConfusionMatrixDisplay
#=======================================================================================================================================#

# -----------------------------
# 1. LOAD DATASET
# -----------------------------
data = pd.read_csv("Amazon_data.csv")

print("Dataset loaded successfully!")
#print(data.head())


# -----------------------------
# 2. DATA CLEANING
# -----------------------------

# Convert Target: -1 → 0 (DOWN), 1 stays 1 (UP)
data['Target'] = data['Target'].replace(-1, 0)

# Drop rows with missing values
data = data.dropna()

# Convert Date to datetime
data['Date'] = pd.to_datetime(data['Date'])

# Sort by time (for time series)
data = data.sort_values(by='Date')


# -----------------------------
# 3. FEATURE SELECTION
# -----------------------------
# Keeping it simple for baseline

# Our INPUT(X) columns
features = ['Close', 'Volume', 'High', 'Low', 'Open']
X = data[features]

# Our OUTPUT (Y) -> 1 == UP, 0 == DOWN
y = data['Target']


# -----------------------------
# 4. TRAIN-TEST SPLIT - splits dataset
# -----------------------------
# DO NOT shuffle (time series data)

# here we are doing:
  # 80% of dataset for ML model training
  # 20% of dataset for ML model testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False
)


# -----------------------------
# 5. SCALE FEATURES
# -----------------------------
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


# -----------------------------
# 6. TRAIN MODEL - learns patterns from part of the dataset (80%)
# -----------------------------

# supposedly ML learns better with precentages so i tried converting them with this (potential to use):
  # data['return'] = data['close'].pctchange()
  # data['hig2low change'] = (data['High'] - data['Low']) / data['Open']
  # data['open2close change'] = (data['Close'] - data['Open']) / data['Open']
  # data['volume change'] = data['Volume'].pct_change()

model = LogisticRegression()

# Only trained on training data
model.fit(X_train_scaled, y_train)

print("\nModel training complete!")


# -----------------------------
# 7. TEST MODEL - evaluates on unseen part of the dataset (20%)
# -----------------------------
# Where predictions are tested
  # Runs predictions on unseen data
y_pred = model.predict(X_test_scaled)

# This accuracy checks how well the model works on new unseen data (the testing data)
accuracy = accuracy_score(y_test, y_pred)

print("\nModel Evaluation:")
print("Accuracy:", accuracy)

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# 7B - Visual Outputs - Confusion Matrix and ROC-AUC Curve - Danny
# Confusion Matrix Heatmap 
cm = confusion_matrix(y_test, y_pred)

fig_cm, ax_cm = plt.subplots(figsize=(6, 5))

# Color-coded confusion matrix with labeled axes (DOWN/UP)
sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=['DOWN (0)', 'UP (1)'],
    yticklabels=['DOWN (0)', 'UP (1)'],
    ax=ax_cm
)
ax_cm.set_title('Confusion Matrix', fontsize=14, fontweight='bold')
ax_cm.set_xlabel('Predicted Label', fontsize=12)
ax_cm.set_ylabel('True Label', fontsize=12)
plt.tight_layout()

# Saves cm as PNG
fig_cm.savefig("baseModelConfusionMatrix.png", dpi=150)
plt.show()

# ROC-AUC Curve
# predict_proba gives probability scores: we use the prob of class 1 (UP)
  # pulls the probability of UP (class 1), which is what ROC needs
# dashed diagonal line on the ROC curve represents a random classifier (AUC = 0.5)
y_prob = model.predict_proba(X_test_scaled)[:, 1]

# Computes FPR/TPR across all thresholds
fpr, tpr, thresholds = roc_curve(y_test, y_prob)

# Single AUC score shown in the legend
roc_auc = auc(fpr, tpr)

fig_roc, ax_roc = plt.subplots(figsize=(7, 5))
ax_roc.plot(fpr, tpr, color='steelblue', lw=2, label=f'ROC Curve (AUC = {roc_auc:.4f})')
ax_roc.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--', label='Random Classifier')
ax_roc.set_xlim([0.0, 1.0])
ax_roc.set_ylim([0.0, 1.05])
ax_roc.set_xlabel('False Positive Rate', fontsize=12)
ax_roc.set_ylabel('True Positive Rate', fontsize=12)
ax_roc.set_title('ROC-AUC Curve — Logistic Regression', fontsize=13, fontweight='bold')
ax_roc.legend(loc='lower right', fontsize=11)
ax_roc.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()

# Save as PNG
fig_roc.savefig("baseModel_ROC_AUC_Curve.png", dpi=150)
print(f"\n AUC Score: {roc_auc:.4f}")
plt.show()

# -----------------------------
# 8. PREDICTION FUNCTION (FOR FRONTEND) - used on new data (outside dataset)
# -----------------------------

def predict_stock(input_data):

    input_df = pd.DataFrame([input_data])

    # Scale using SAME scaler
    input_scaled = scaler.transform(input_df)

    # UP/DOWN Prediction
    prediction = model.predict(input_scaled)[0]
    probabilities = model.predict_proba(input_scaled)[0]

    # Frontend would display this part later
    return {
        "prediction": "UP" if prediction == 1 else "DOWN",
        "confidence": max(probabilities)
    }


# -----------------------------
# 9. TEST PREDICTION FUNCTION
# -----------------------------
sample_input = {
    'Close': 150,
    'Volume': 1000000,
    'High': 152,
    'Low': 148,
    'Open': 149
}

result = predict_stock(sample_input)

print("\nSample Prediction:")
print(result)
#=======================================================================================================================================#
# Danny and Kel Comments:
  # Our model takes stock features like price and volume, and outputs whether the stock is predicted to go up or down.
  # Internally, it predicts a 0 or 1, which we map to DOWN or UP.
  # We trained our model on 80% of the data and tested it on the remaining 20% to evaluate how well it generalizes.
  # Then we built a prediction function that can take in new stock data and output whether the price will go up or down.
    # That function will later connect to the UI/frontend