import os
import sys

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import Config, validate_config
from models import db
from routes import api


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    validate_config()
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Enable CORS globally across all API endpoints paths utilizing flask_cors mapping
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    db.init_app(app)
    app.register_blueprint(api, url_prefix="/api")

    @app.get("/")
    def index():
        return jsonify({"message": "Invoice Automation API is live!", "status": "ok"})

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok"})

    @app.route('/api/invoice/commit', methods=['POST'])
    def commit_invoice():
        try:
            data = request.get_json() or {}
            client = data.get('client', '—')
            description = data.get('description', '—')
            subtotal = data.get('subtotal', '—')
            tax = data.get('tax', '—')
            total = data.get('total', '—')
            frequency = data.get('frequency', 'One-time')

            # Beautifully formatted transaction panel schema logging to sys.stderr
            # ASCII characters only to prevent UnicodeEncodeError on Windows
            print("\n==================================================", file=sys.stderr)
            print(" [aathifproject2026] AGENT LEDGER TRANSACTION LOG", file=sys.stderr)
            print("==================================================", file=sys.stderr)
            print(f" Client Context : {client}", file=sys.stderr)
            print(f" Specification  : {description}", file=sys.stderr)
            print(f" Base Subtotal  : {subtotal}", file=sys.stderr)
            print(f" Tax Fraction   : {tax}", file=sys.stderr)
            print(f" Core Interval  : {frequency}", file=sys.stderr)
            print(f" Total Gross    : {total}", file=sys.stderr)
            print("==================================================\n", file=sys.stderr)

            return jsonify({
                "status": "success",
                "message": f"Draft committed to ledger successfully for client: {client}",
                "data": data
            }), 200
        except Exception as e:
            print(f"Error in commit: {str(e)}", file=sys.stderr)
            return jsonify({"status": "error", "message": f"Server processing breakdown: {str(e)}"}), 500

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


# Instantiate app globally at module level for WSGI servers
app = create_app()


if __name__ == "__main__":
    print("Antigravity Overpass: Running Flask app layer on http://localhost:5000")
    # Bind to 0.0.0.0 to prevent localhost address resolution mismatch on Windows
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)