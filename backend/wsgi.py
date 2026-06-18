import importlib.util
from pathlib import Path


app_path = Path(__file__).with_name("app.py")
spec = importlib.util.spec_from_file_location("invoice_flask_app", app_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load Flask app.py")

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
app = module.app
