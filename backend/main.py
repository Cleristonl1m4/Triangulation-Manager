from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database
from config import settings
from scheduler import (
    schedule_auto_disable,
    unschedule_auto_disable,
    remaining_seconds,
)
from datetime import datetime

app = FastAPI(title="Gerenciador de Triangulação de Permissões")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

TRIANGULO_PAIRS = [(36, 15), (36, 16), (50, 36)]


def _is_ativa() -> bool:
    rows = database.get_triangulacao_rows()
    pairs = {(r["controle_selecionado"], r["controle_permitido_alterar"]) for r in rows}
    return all(p in pairs for p in TRIANGULO_PAIRS)


def _expire():
    database.delete_triangulacao()
    database.clear_activation_time()
    unschedule_auto_disable()


@app.post("/triangulacao")
def ativar():
    if _is_ativa():
        return {"mensagem": "Triangulação já está ativa."}
    database.insert_triangulacao()
    # Persist activation time so all backend processes can report remaining time
    database.set_activation_time(datetime.utcnow())
    schedule_auto_disable(settings.triangulacao_segundos, _expire)
    return {"mensagem": "Triangulação ativada com sucesso por 10 minutos."}


@app.get("/triangulacao")
def consultar():
    rows = database.get_triangulacao_rows()
    # Ensure values are compared as integers (some drivers/clients may return strings)
    pairs_in_db = {
        (int(r["controle_selecionado"]), int(r["controle_permitido_alterar"]))
        for r in rows
        if r["controle_selecionado"] is not None and r["controle_permitido_alterar"] is not None
    }
    ativa = all((s, p) in pairs_in_db for (s, p) in TRIANGULO_PAIRS)

    # Debug logs to help diagnose mismatch between rows and active flag
    print("[backend] /triangulacao rows:", rows)
    print("[backend] /triangulacao pairs_in_db:", pairs_in_db)
    print("[backend] /triangulacao ativa:", ativa)

    # Prefer a persisted activation timestamp when available (works across processes).
    tempo = 0
    if ativa:
        activation = database.get_activation_time()
        if activation is not None:
            # activation is stored as UTC naive/datetime; compute elapsed
            elapsed = (datetime.utcnow() - activation).total_seconds()
            tempo = max(settings.triangulacao_segundos - int(elapsed), 0)
        else:
            tempo = remaining_seconds(settings.triangulacao_segundos)
    return {"ativa": ativa, "tempo_restante_segundos": tempo, "dados": rows}


@app.delete("/triangulacao")
def desativar():
    database.delete_triangulacao()
    database.clear_activation_time()
    unschedule_auto_disable()
    return {"mensagem": "Triangulação desativada com sucesso."}
