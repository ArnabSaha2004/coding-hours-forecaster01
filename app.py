from flask import Flask, render_template, request
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

# Load the model artifact
artifact = joblib.load("ml/model.pkl")   # <-- model.pkl is inside ml/
pipeline = artifact["pipeline"]
use_log = artifact["use_log_target"]
features = artifact["features"]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Collect form inputs
        hobby = request.form.get("hobby_top1")
        club = request.form.get("club_top1")
        reads_books = request.form.get("reads_books")

        # Derived / engineered features
        hobby_is_coding = 1 if any(x in hobby.lower() for x in ["code","program","dev","python","java","coding"]) else 0
        club_is_tech = 1 if any(x in club.lower() for x in ["code","robot","tech","program","cs","computer"]) else 0
        reads_books_bin = 1 if reads_books.lower() in ["yes","y","true","1"] else 0

        # Build DataFrame for prediction
        row = pd.DataFrame([{
            "hobby_top1": hobby,
            "club_top1": club,
            "hobby_is_coding": hobby_is_coding,
            "club_is_tech": club_is_tech,
            "reads_books_bin": reads_books_bin
        }])[features]   # ensure correct order

        # Prediction
        pred_raw = pipeline.predict(row)
        pred = np.expm1(pred_raw) if use_log else pred_raw

        return render_template("result.html", prediction=round(float(pred[0]), 2))

    except Exception as e:
        return render_template("result.html", prediction=f"Error: {str(e)}")

if __name__ == "__main__":
    app.run(debug=True)
