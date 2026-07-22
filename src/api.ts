import type { ApiMensagem, TriangulacaoStatus } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getStatus(): Promise<TriangulacaoStatus> {
  const res = await fetch(`${API_BASE}/triangulacao`);
  return handle<TriangulacaoStatus>(res);
}

export async function ativarTriangulacao(): Promise<ApiMensagem> {
  const res = await fetch(`${API_BASE}/triangulacao`, { method: "POST" });
  return handle<ApiMensagem>(res);
}

export async function desativarTriangulacao(): Promise<ApiMensagem> {
  const res = await fetch(`${API_BASE}/triangulacao`, { method: "DELETE" });
  return handle<ApiMensagem>(res);
}
