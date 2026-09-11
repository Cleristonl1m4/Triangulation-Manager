import sys
import os
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

load_dotenv(ROOT_DIR / ".env")

sys.path.insert(0, str(BACKEND_DIR))

os.chdir(str(BACKEND_DIR))

PORT = int(os.getenv("PORT", "5017"))
HOST = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,
    )
