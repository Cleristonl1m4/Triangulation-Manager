import pyodbc
from config import settings


def get_connection() -> pyodbc.Connection:
    return pyodbc.connect(settings.connection_string)


def insert_triangulacao() -> None:
    pairs = [(36, 15), (36, 16), (50, 36)]
    conn = get_connection()
    try:
        cursor = conn.cursor()
        for sel, perm in pairs:
            cursor.execute(
                "INSERT INTO tegercontrpedperm (controle_selecionado, controle_permitido_alterar) "
                "VALUES (?, ?)",
                sel,
                perm,
            )
        conn.commit()
    finally:
        conn.close()


def delete_triangulacao() -> None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        for sel, perm in [(36, 15), (36, 16), (50, 36)]:
            cursor.execute(
                "DELETE FROM tegercontrpedperm WHERE controle_selecionado = ? AND controle_permitido_alterar = ?",
                sel,
                perm,
            )
        conn.commit()
    finally:
        conn.close()


def get_triangulacao_rows() -> list[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT controle_selecionado, controle_permitido_alterar FROM tegercontrpedperm "
            "WHERE (controle_selecionado = 36 AND controle_permitido_alterar = 15) "
            "OR (controle_selecionado = 36 AND controle_permitido_alterar = 16) "
            "OR (controle_selecionado = 50 AND controle_permitido_alterar = 36)"
        )
        rows = cursor.fetchall()
        return [
            {
                "controle_selecionado": row.controle_selecionado,
                "controle_permitido_alterar": row.controle_permitido_alterar,
            }
            for row in rows
        ]
    finally:
        conn.close()


# Persist activation time in the database so status/remaining time is consistent
# across multiple backend processes (e.g., when using uvicorn --reload).
from datetime import datetime

def set_activation_time(ts: datetime) -> None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # Ensure metadata table exists
        cursor.execute(
            "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'triangulacao_meta') AND type in (N'U'))"
            " BEGIN CREATE TABLE triangulacao_meta (meta_key NVARCHAR(50) PRIMARY KEY, meta_value DATETIME2) END"
        )
        # Try update first
        cursor.execute("UPDATE triangulacao_meta SET meta_value = ? WHERE meta_key = ?", ts, "activated_at")
        if cursor.rowcount == 0:
            cursor.execute("INSERT INTO triangulacao_meta (meta_key, meta_value) VALUES (?, ?)", "activated_at", ts)
        conn.commit()
    finally:
        conn.close()


def get_activation_time() -> datetime | None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT meta_value FROM triangulacao_meta WHERE meta_key = ?", "activated_at")
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def clear_activation_time() -> None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM triangulacao_meta WHERE meta_key = ?", "activated_at")
        conn.commit()
    finally:
        conn.close()


def get_reptec_connection() -> pyodbc.Connection:
    return pyodbc.connect(settings.reptec_connection_string)


def insert_log(nome_usuario: str, codigo_usuario: str, login_usuario: str, acao: str) -> None:
    conn = get_reptec_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DB_NAME()")
        db_name = cursor.fetchone()[0]
        print(f"[database] insert_log conectado ao banco: {db_name}")
        cursor.execute(
            "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'triangulacao_log') AND type in (N'U'))"
            " BEGIN CREATE TABLE triangulacao_log ("
            "   id INT IDENTITY PRIMARY KEY,"
            "   nome_usuario NVARCHAR(200),"
            "   codigo_usuario NVARCHAR(50),"
            "   login_usuario NVARCHAR(100),"
            "   acao NVARCHAR(50),"
            "   data_hora DATETIME2"
            ") END"
        )
        cursor.execute(
            "INSERT INTO triangulacao_log (nome_usuario, codigo_usuario, login_usuario, acao, data_hora) "
            "VALUES (?, ?, ?, ?, GETUTCDATE())",
            nome_usuario,
            codigo_usuario,
            login_usuario,
            acao,
        )
        conn.commit()
        print(f"[database] insert_log OK: {acao} por {nome_usuario}")
    finally:
        conn.close()
