import type { ApiMensagem, TriangulacaoStatus, UserData } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "";

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

export async function ativarTriangulacao(usuario?: UserData): Promise<ApiMensagem> {
  const res = await fetch(`${API_BASE}/triangulacao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario ?? {}),
  });
  return handle<ApiMensagem>(res);
}

export async function desativarTriangulacao(usuario?: UserData): Promise<ApiMensagem> {
  const res = await fetch(`${API_BASE}/triangulacao`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario ?? {}),
  });
  return handle<ApiMensagem>(res);
}
