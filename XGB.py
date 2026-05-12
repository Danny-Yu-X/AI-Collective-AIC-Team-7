import pandas as pd
import xgboost as xgb
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, RocCurveDisplay

# Read the file
data = pd.read_csv("Amazon_data.csv")

data = data.sort_values("Date")  # sort by Date

data["Target"] = data["Target"].map({1: 1, -1: 0})

# drop unwanted columns

drop_cols = ["Date", "Company", "Comments", "Cleaned_Text", "Return","Sentiment", "Sentiment_Signed", "Adj Close", "Score","Sentiment_Score"]
data = data.drop(columns=drop_cols, errors="ignore")
data = data.dropna() #removes missing data
features = ['Close', 'High', 'Low', 'Open', 'Volume']

X = data[features]
y = data["Target"]
# train 80% data and 20% testing
# Keep shuffle false since data is time sensitive
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False
)
# Using Classifier
model = xgb.XGBClassifier()

# train model
model.fit(X_train, y_train)
# make predictions
pred = model.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, pred))
print("\nClassification Report:\n", classification_report(y_test, pred))
# prints feature on which model is trained
print(model.get_booster().feature_names)
plt.figure()
cm = confusion_matrix(y_test, pred)
plt.imshow(cm)
plt.title("Confusion Matrix")
plt.colorbar()
plt.xticks([0, 1], ["Down", "Up"])
plt.yticks([0, 1], ["Down", "Up"])
for i in range(2):
    for j in range(2):
        plt.text(j, i, cm[i, j], ha="center", va="center")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.show()
plt.savefig("CM_Xgb.png", dpi=300, bbox_inches="tight")

# sample data
sample_input = {
    'Close': 150,
    'High': 152,
    'Low': 148,
    'Open': 149,
    'Volume': 1000000,

}
# Convert data into dataframe 
#  XGBooster accepts dataframe(2D table)
sample_data = pd.DataFrame([sample_input])

result = model.predict(sample_data)

print("\nSample Prediction:")
print(result)
print("Training data: ",y_train.value_counts())
print("Testing data: ",y_test.value_counts())

# 5. Plot
RocCurveDisplay.from_estimator(
    estimator=model,   # your trained XGBoost model
    X=X_test,          # test features
    y=y_test,          # true labels
    name="XGBoost",
    plot_chance_level=True
)
plt.title("ROC Curve")
#plt.show()
plt.savefig("roc_curve.png", dpi=300, bbox_inches="tight")
