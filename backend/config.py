import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    db_host: str = os.getenv("DB_HOST", "")
    db_port: str = os.getenv("DB_PORT", "")
    db_name: str = os.getenv("DB_NAME", "")
    db_user: str = os.getenv("DB_USER", "")
    db_password: str = os.getenv("DB_PASSWORD", "")
    db_driver: str = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")
    db_encrypt: str = os.getenv("DB_ENCRYPT", "no")
    db_trust_cert: str = os.getenv("DB_TRUST_SERVER_CERTIFICATE", "yes")
    triangulacao_segundos: int = int(os.getenv("TRIANGULACAO_SEGUNDOS", "600"))

    @property
    def connection_string(self) -> str:
        return (
            f"DRIVER={self.db_driver};"
            f"SERVER={self.db_host},{self.db_port};"
            f"DATABASE={self.db_name};"
            f"UID={self.db_user};"
            f"PWD={self.db_password};"
            f"Encrypt={self.db_encrypt};"
            f"TrustServerCertificate={self.db_trust_cert};"
        )


settings = Settings()
