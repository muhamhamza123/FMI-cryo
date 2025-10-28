from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/locations")
def locations():
    with open("locations.json") as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
