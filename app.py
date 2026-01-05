from flask import Flask, render_template, jsonify, abort
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import json
import os

app = Flask(__name__)

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[]
)

@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    #response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' https://unpkg.com; "
        "style-src 'self' https://unpkg.com; "
        "img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com; "
        "connect-src 'self' https://unpkg.com; "
        "font-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "upgrade-insecure-requests;"
    )
    return response
    

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/locations")
@limiter.limit("50 per minute")
def locations():
    file_path = os.path.join(app.root_path, "locations.json")

    if not os.path.exists(file_path):
        abort(404)

    with open(file_path, encoding="utf-8") as f:
        data = json.load(f)

    return jsonify(data)

@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify(error="Rate limit exceeded"), 429

if __name__ == "__main__":
    app.run(debug=False)