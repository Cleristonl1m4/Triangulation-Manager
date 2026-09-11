# Triangulation Manager

Full-stack application for **temporary** (10-minute) activation of permission triangulation rules in a **Microsoft SQL Server** database, controlled by a Python backend with automatic timer.

## Architecture

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend  | Python + FastAPI + APScheduler + pyodbc  |
| Database | Microsoft SQL Server                     |

Triangulation is activated by inserting 3 specific pairs into the `tegercontrpedperm` table. The backend schedules a background task (APScheduler) that removes the records after exactly **600 seconds (10 minutes)**, regardless of whether the frontend is open.

### Triangulation Pairs

| controle_selecionado | controle_permitido_alterar |
| -------------------- | -------------------------- |
| 36                   | 15                         |
| 36                   | 16                         |
| 50                   | 36                         |

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Microsoft SQL Server** accessible
- **ODBC Driver 17 (or 18) for SQL Server** installed on the backend host

### 1. Install the SQL Server ODBC Driver

**Ubuntu / Debian:**

```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17 unixodbc-dev
```

**macOS (Homebrew):**

```bash
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew update
brew install msodbcsql17 mssql-tools
```

**Windows:** Download and install the [Microsoft ODBC Driver 17 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server).

> If using Driver 18, adjust the `DB_DRIVER` variable in the `.env` file.

## Environment Configuration

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

### Required Variables

```env
# Database
DB_HOST=your-db-host
DB_PORT=1433
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_DRIVER={ODBC Driver 17 for SQL Server}
DB_ENCRYPT=no
DB_TRUST_SERVER_CERTIFICATE=yes

# Backend timing (seconds) - 10 minutes by business rule
TRIANGULACAO_SEGUNDOS=600

# REPTEC database for audit log
REPTEC_DB_NAME=your-reptec-db-name

# Server
PORT=5017
HOST=0.0.0.0

# External login API (optional)
VITE_LOGIN_API_URL=https://your-login-api.com/api/genericos/ge
```

## How to Run

### Production (Single Port)

Build the frontend and start the unified server:

```bash
npm start
```

This will:
1. Build the React frontend into `dist/`
2. Start the FastAPI server on port 5017 (configurable via `PORT`)
3. Serve both the API and the frontend from the same port

### Development

**Backend:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 5017
```

**Frontend:**

```bash
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:5019` with hot reload.

## Database Table

**Table:** `tegercontrpedperm`

| Column                       | Type | Description                            |
| ---------------------------- | ---- | -------------------------------------- |
| `controle_selecionado`       | INT  | Source control code                    |
| `controle_permitido_alterar` | INT  | Control code that can be modified      |

> The application assumes this table **already exists**. It only inserts, queries, and removes the 3 specific triangulation records.

Reference DDL (if needed):

```sql
CREATE TABLE tegercontrpedperm (
    controle_selecionado       INT NOT NULL,
    controle_permitido_alterar INT NOT NULL
);
```

## REST API Specification

The API exposes 3 endpoints under the `/triangulacao` prefix.

### POST `/triangulacao` - Activate Triangulation

Inserts the 3 specific records (`36->15`, `36->16`, `50->36`) into `tegercontrpedperm` and starts the 10-minute backend timer (via APScheduler).

**Request body:**

```json
{
  "nome_usuario": "User Name",
  "codigo_usuario": "123",
  "login_usuario": "user.login"
}
```

**Response 200:**

```json
{ "mensagem": "Triangulacao ativada com sucesso por 10 minutos." }
```

### GET `/triangulacao` - Query Status

Checks the database for the 3 records and returns the current state, records, and remaining time in seconds.

**Response 200 (active):**

```json
{
  "ativa": true,
  "tempo_restante_segundos": 600,
  "dados": [
    { "controle_selecionado": 36, "controle_permitido_alterar": 15 },
    { "controle_selecionado": 36, "controle_permitido_alterar": 16 },
    { "controle_selecionado": 50, "controle_permitido_alterar": 36 }
  ]
}
```

### DELETE `/triangulacao` - Deactivate Triangulation

Immediately removes the 3 specific records and cancels the backend schedule.

**Response 200:**

```json
{ "mensagem": "Triangulacao desativada com sucesso." }
```

## Timer Behavior (10 minutes)

1. On `POST /triangulacao`, the backend schedules a one-shot task in **APScheduler** (`DateTrigger`) to run after 600 seconds.
2. The activation timestamp is persisted in the database for cross-process consistency.
3. When time expires, the backend **automatically removes the 3 records** - even if the frontend is closed.
4. `DELETE /triangulacao` cancels the schedule and removes records immediately.
5. The frontend polls `GET` every 5 seconds and maintains a local countdown synchronized between polls.

## Project Structure

```
.
├── backend/
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variable template
│   ├── config.py             # Configuration / connection string
│   ├── database.py           # SQL Server access (pyodbc)
│   ├── scheduler.py          # APScheduler (10-min timer)
│   └── main.py               # FastAPI app with endpoints
├── src/
│   ├── api.ts                # HTTP client for the API
│   ├── types.ts              # Shared TypeScript types
│   ├── App.tsx               # Main management screen
│   ├── main.tsx              # React entry point
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication state management
│   ├── services/
│   │   └── login.ts          # External login API service
│   └── components/
│       ├── Countdown.tsx          # SVG ring countdown timer
│       ├── StatusBadge.tsx        # Active/Inactive indicator
│       ├── TriangulacaoTable.tsx  # tegercontrpedperm table
│       └── LoginScreen.tsx        # Login form
├── start.py                  # Unified server entry point
├── .env                      # Environment variables (git-ignored)
└── README.md
```

## Important Commands

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm start`          | Build frontend + start unified server    |
| `npm run dev`        | Start Vite dev server with hot reload    |
| `npm run build`      | Build frontend for production            |
| `npm run typecheck`  | Run TypeScript type checking             |
| `npm run lint`       | Run ESLint                               |
