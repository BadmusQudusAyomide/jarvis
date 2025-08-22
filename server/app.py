from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import pathlib

app = Flask(__name__)
# Only allow local dev origins (adjust if you use a different dev port)
CORS(app, resources={r"/command": {"origins": [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]}})

# Optional simple auth via bearer token
AUTH_TOKEN = os.environ.get("AUTOMATION_TOKEN")

def ok(msg):
    return jsonify({"status": "success", "message": msg})


def err(msg, code=400):
    return jsonify({"status": "error", "message": msg}), code


# Resolve common Windows folders
HOME = pathlib.Path.home()
FOLDERS = {
    "documents": HOME / "Documents",
    "downloads": HOME / "Downloads",
    "pictures": HOME / "Pictures",
    "desktop": HOME / "Desktop",
}


def open_folder(path: pathlib.Path):
    if not path.exists():
        raise FileNotFoundError(str(path))
    os.startfile(str(path))  # Windows only


# Strict allowlist: map friendly commands to exact actions
ALLOWLIST = {
    # Apps
    "open notepad": lambda: subprocess.Popen(["notepad.exe"], shell=False),
    "open calculator": lambda: subprocess.Popen(["calc.exe"], shell=False),
    "open chrome": lambda: subprocess.Popen(["cmd", "/c", "start", "chrome"], shell=False),
    "open vscode": lambda: subprocess.Popen(["cmd", "/c", "start", "code"], shell=False),
    "open paint": lambda: subprocess.Popen(["mspaint.exe"], shell=False),

    # Folders
    "open documents": lambda: open_folder(FOLDERS["documents"]),
    "open downloads": lambda: open_folder(FOLDERS["downloads"]),
    "open pictures": lambda: open_folder(FOLDERS["pictures"]),
    "open desktop": lambda: open_folder(FOLDERS["desktop"]),
}


@app.post("/command")
def command():
    if AUTH_TOKEN:
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {AUTH_TOKEN}":
            return err("Unauthorized", 401)

    data = request.get_json(silent=True) or {}
    cmd = (data.get("command") or "").strip().lower()
    if cmd not in ALLOWLIST:
        return err("Command not allowed")

    try:
        ALLOWLIST[cmd]()
        return ok(f"Executing: {cmd}")
    except Exception as e:
        return err(str(e), 500)


if __name__ == "__main__":
    # Bind to localhost only for safety
    app.run(host="127.0.0.1", port=5000, debug=True)
