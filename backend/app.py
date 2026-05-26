from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    # 1. Grab the exact stock symbol the user selected on the frontend
    # Default to "AMZN" just as a safe fallback if none is provided
    stock_symbol = data.get("symbol", "AMZN") 
    
    # 2. Define expected file names based on user choice
    model_filename = f"rf_model_{stock_symbol}.pkl"
    scaler_filename = f"scaler_{stock_symbol}.pkl"

    # 3. Validation Check: Make sure you've trained the model for this stock!
    if not os.path.exists(model_filename) or not os.path.exists(scaler_filename):
        return jsonify({
            "error": f"Model for {stock_symbol} not trained yet. Please run RFModel.py for this stock."
        }), 400

    try:
        # 4. Load the specific model and scaler for the chosen stock
        model = joblib.load(model_filename)
        scaler = joblib.load(scaler_filename)

        # 5. Extract numerical data to feed the model
        input_data = pd.DataFrame([{
            "Close": data["close"],
            "Volume": data["volume"],
            "High": data["high"],
            "Low": data["low"],
            "Open": data["open"]
        }])

        # Scale
        input_scaled = scaler.transform(input_data)

        # Predict
        prediction = model.predict(input_scaled)[0]

        # Confidence
        probability = model.predict_proba(input_scaled)[0]
        confidence = max(probability)

        # 6. Format the result to return to script.js
        result = {
            "prediction": "UP" if prediction == 1 else "DOWN",
            "confidence": round(confidence * 100, 2)
        }

        return jsonify(result)

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)