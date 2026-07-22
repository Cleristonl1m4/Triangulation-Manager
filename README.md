# Gerenciador de Triangulação

Aplicação full-stack para ativação **temporária** (10 minutos) de regras de triangulação
de permissões em um banco **Microsoft SQL Server**, controlada por um backend Python
com temporizador automático.

---

## Arquitetura

| Camada    | Tecnologia                                   |
| --------- | --------------------------------------------- |
| Frontend  | React + Vite + TypeScript + Tailwind CSS      |
| Backend   | Python + FastAPI + APScheduler + pyodbc       |
| Banco     | Microsoft SQL Server                          |

A triangulação é ativada inserindo 3 pares específicos na tabela `tegercontrpedperm`.
O backend agenda uma tarefa em segundo plano (APScheduler) que remove os registros
após exatos **600 segundos (10 minutos)**, independente do frontend estar aberto.

### Pares da triangulação

| controle_selecionado | controle_permitido_alterar |
| --------------------- | -------------------------- |
| 36                    | 15                         |
| 36                    | 16                         |
| 50                    | 36                         |

---

## Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.10+
- **Microsoft SQL Server** acessível
- **Driver ODBC 17 (ou 18) for SQL Server** instalado no host do backend

### 1. Instalar o Driver ODBC do SQL Server

O `pyodbc` precisa do driver ODBC nativo da Microsoft.

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

**Windows:** baixe e instale o
[Microsoft ODBC Driver 17 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server).

> Se você usar o Driver 18, ajuste a variável `DB_DRIVER` no `.env` do backend.

---

## Configuração de Variáveis de Ambiente

### Backend (`backend/.env`)

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cd backend
cp .env.example .env
```

Conteúdo:

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_DRIVER={ODBC Driver 17 for SQL Server}
DB_ENCRYPT=no
DB_TRUST_SERVER_CERTIFICATE=yes
TRIANGULACAO_SEGUNDOS=600
```

> O valor `TRIANGULACAO_SEGUNDOS=600` define os 10 minutos exigidos pela regra de negócio.

### Frontend (`.env` na raiz do projeto)

```env
VITE_API_URL=http://localhost:8000
```

Ajuste a URL caso o backend rode em outra porta/host.

---

## Como iniciar

### Backend (API Python)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

A API ficará disponível em `http://localhost:8000` e a documentação interativa em
`http://localhost:8000/docs`.

### Frontend (React + Vite)

```bash
# na raiz do projeto
npm install
npm run dev
```

A interface abre em `http://localhost:5173`.

---

## Tabela do Banco de Dados

**Tabela:** `tegercontrpedperm`

| Coluna                    | Tipo | Descrição                          |
| ------------------------- | ---- | ---------------------------------- |
| `controle_selecionado`    | INT  | Código do controle de origem       |
| `controle_permitido_alterar` | INT | Código do controle que pode ser alterado |

> A aplicação assume que esta tabela **já existe** no banco. Ela apenas insere,
> consulta e remove os 3 registros específicos da triangulação.

DDL de referência (se precisar criar):

```sql
CREATE TABLE tegercontrpedperm (
    controle_selecionado       INT NOT NULL,
    controle_permitido_alterar INT NOT NULL
);
```

---

## Especificação da API REST

A API expõe 3 endpoints, todos sob o prefixo `/triangulacao`.

### POST `/triangulacao` — Ativar Triangulação

Insere os 3 registros específicos (`36→15`, `36→16`, `50→36`) na tabela
`tegercontrpedperm` e dispara o temporizador interno de 10 minutos no backend
(via APScheduler).

**Resposta 200:**

```json
{ "mensagem": "Triangulação ativada com sucesso por 10 minutos." }
```

Se já estiver ativa:

```json
{ "mensagem": "Triangulação já está ativa." }
```

---

### GET `/triangulacao` — Consultar Status

Verifica no banco se os 3 registros estão presentes e retorna o estado atual, os
registros e o tempo restante em segundos.

**200 — Quando ativa:**

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

**200 — Quando inativa:**

```json
{
  "ativa": false,
  "tempo_restante_segundos": 0,
  "dados": []
}
```

---

### DELETE `/triangulacao` — Desativar Triangulação

Remove imediatamente apenas os 3 registros específicos da tabela
`tegercontrpedperm` e cancela o agendamento no backend.

**Resposta 200:**

```json
{ "mensagem": "Triangulação desativada com sucesso." }
```

---

## Funcionamento do Temporizador (10 minutos)

1. Ao chamar `POST /triangulacao`, o backend agenda uma tarefa única no
   **APScheduler** (`DateTrigger`) para executar após 600 segundos.
2. O horário de ativação é armazenado em memória para calcular o
   `tempo_restante_segundos` retornado pelo `GET`.
3. Quando o tempo expira, o backend **remove os 3 registros automaticamente** —
   mesmo que o frontend esteja fechado.
4. O `DELETE /triangulacao` cancela o agendamento e remove os registros imediatamente.
5. O frontend faz polling a cada 5 segundos no `GET` e mantém um contador regressivo
   local sincronizado entre os polls.

---

## Estrutura do Projeto

```
.
├── backend/
│   ├── requirements.txt      # dependências Python
│   ├── .env.example          # template de variáveis de ambiente
│   ├── config.py             # leitura de configurações / connection string
│   ├── database.py           # acesso ao SQL Server (pyodbc)
│   ├── scheduler.py          # APScheduler (temporizador de 10 min)
│   └── main.py               # FastAPI app com os 3 endpoints
├── src/
│   ├── api.ts                # cliente HTTP para a API
│   ├── types.ts              # tipos compartilhados
│   ├── App.tsx               # tela principal
│   └── components/
│       ├── Countdown.tsx          # contador regressivo visual (anel SVG)
│       ├── StatusBadge.tsx        # indicador Ativo / Inativo
│       └── TriangulacaoTable.tsx  # tabela tegercontrpedperm
└── README.md
```
