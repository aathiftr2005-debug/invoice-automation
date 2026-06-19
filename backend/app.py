import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config, validate_config
from models import db
from routes import api


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    validate_config()
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    CORS(
        app,
        resources={r"/api/*": {"origins": [app.config["FRONTEND_URL"]]}},
        supports_credentials=False,
    )
    db.init_app(app)
    app.register_blueprint(api, url_prefix="/api")

    @app.get("/")
    def index():
        return jsonify({"message": "Invoice Automation API is live!", "status": "ok"})

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok"})

    @app.errorhandler(413)
    def file_too_large(_error):
        return jsonify({"error": "File exceeds the 10MB upload limit."}), 413

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(500)
    def server_error(_error):
        return jsonify({"error": "An unexpected server error occurred."}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))

