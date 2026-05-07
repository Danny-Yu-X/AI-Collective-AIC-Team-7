import pandas as pd
import xgboost as xgb
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

# Read the file
data = pd.read_csv("Amazon_data.csv")

data = data.sort_values("Date")  # sort by Date

data["Target"] = data["Target"].map({1: 1, -1: 0})

'''
# Gives return percentage
data["Return"] = data["Close"].pct_change()
# Calculates mean over 5/10/30 no. of days
data["MA_5"] = data["Close"].rolling(5).mean()
data["MA_30"] = data["Close"].rolling(30).mean()
data["MA_10"] = data["Close"].rolling(10).mean()
data["MA_90"] = data["Close"].rolling(90).mean()
data["MA_365"] = data["Close"].rolling(365).mean()



# Calculates standard deviation to check high/low volatility 
data["Volatility"] = data["Close"].rolling(5).std()

# Give value to each Postive, negative, neutral and multiply by sentiment score
data["Sentiment_Signed"] = data["Sentiment"].map({
    "Positive": 1,
    "Neutral": 0,
    "Negative": -1
}) * data["Sentiment_Score"]

data["Sentiment_Lag1"] = data["Sentiment_Signed"].shift(1)
'''
# drop unwanted columns

drop_cols = ["Date", "Company", "Comments", "Cleaned_Text", "Return","Sentiment", "Sentiment_Signed", "Adj Close", "Score","Sentiment_Score"]
data = data.drop(columns=drop_cols, errors="ignore")
#data = data.dropna() removes missing data
features = ['Close', 'High', 'Low', 'Open', 'Volume' ]

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
# Print confusion matrix
cm = confusion_matrix(y_test, pred)
print(cm)

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