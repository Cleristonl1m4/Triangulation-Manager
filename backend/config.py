import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


def _build_connection_string(host: str, port: str, database: str, user: str, password: str, driver: str, encrypt: str, trust_cert: str) -> str:
    return (
        f"DRIVER={driver};"
        f"SERVER={host},{port};"
        f"DATABASE={database};"
        f"UID={user};"
        f"PWD={password};"
        f"Encrypt={encrypt};"
        f"TrustServerCertificate={trust_cert};"
    )


@dataclass(frozen=True)
class Settings:
    db_host: str = os.getenv("DB_HOST", "")
    db_port: str = os.getenv("DB_PORT", "1433")
    db_name: str = os.getenv("DB_NAME", "")
    db_user: str = os.getenv("DB_USER", "")
    db_password: str = os.getenv("DB_PASSWORD", "")
    db_driver: str = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")
    db_encrypt: str = os.getenv("DB_ENCRYPT", "no")
    db_trust_cert: str = os.getenv("DB_TRUST_SERVER_CERTIFICATE", "yes")
    triangulacao_segundos: int = int(os.getenv("TRIANGULACAO_SEGUNDOS", "600"))

    reptec_db_name: str = os.getenv("REPTEC_DB_NAME", "REPTEC")

    @property
    def connection_string(self) -> str:
        return _build_connection_string(
            self.db_host, self.db_port, self.db_name,
            self.db_user, self.db_password, self.db_driver,
            self.db_encrypt, self.db_trust_cert,
        )

    @property
    def reptec_connection_string(self) -> str:
        return _build_connection_string(
            self.db_host, self.db_port, self.reptec_db_name,
            self.db_user, self.db_password, self.db_driver,
            self.db_encrypt, self.db_trust_cert,
        )


settings = Settings()
