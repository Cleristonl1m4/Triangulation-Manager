import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, LogOut, Power, PowerOff, RefreshCw } from "lucide-react";
import { ativarTriangulacao, desativarTriangulacao, getStatus } from "./api";
import type { TriangulacaoStatus } from "./types";
import Countdown from "./components/Countdown";
import StatusBadge from "./components/StatusBadge";
import TriangulacaoTable from "./components/TriangulacaoTable";
import LoginScreen from "./components/LoginScreen";
import { useAuth } from "./context/AuthContext";

const INITIAL: TriangulacaoStatus = { ativa: false, tempo_restante_segundos: 0, dados: [] };

function ManagementScreen() {
  const { session, logout } = useAuth();
  const [status, setStatus] = useState<TriangulacaoStatus>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [displaySegundos, setDisplaySegundos] = useState(0);
  const ultimoServerTempo = useRef<number>(0);
  const ultimoSyncRef = useRef<number>(Date.now());

  const buscar = useCallback(async () => {
    try {
      const data = await getStatus();
      console.log("[App] getStatus response:", data);
      setStatus(data);
      setDisplaySegundos(data.tempo_restante_segundos);
      ultimoServerTempo.current = data.tempo_restante_segundos;
      ultimoSyncRef.current = Date.now();
      setErro(null);
    } catch (e) {
      console.error("[App] getStatus error:", e);
      setErro(e instanceof Error ? e.message : "Falha ao conectar com a API.");
    }
  }, []);

  useEffect(() => {
    buscar();
    const interval = setInterval(buscar, 5000);
    return () => clearInterval(interval);
  }, [buscar]);

  useEffect(() => {
    if (!status.ativa) {
      setDisplaySegundos(0);
      return;
    }
    const tick = setInterval(() => {
      const elapsedSinceSync = Math.floor((Date.now() - ultimoSyncRef.current) / 1000);
      const local = Math.max(ultimoServerTempo.current - elapsedSinceSync, 0);
      setDisplaySegundos(local);
    }, 1000);
    return () => clearInterval(tick);
  }, [status.ativa, status.tempo_restante_segundos]);

  const ativar = async () => {
    setLoading(true);
    setErro(null);
    try {
      await ativarTriangulacao({
        nome_usuario: session?.NomeUsuario ?? "",
        codigo_usuario: session?.Codigo ?? "",
        login_usuario: session?.LoginUsuario ?? "",
      });
      await buscar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao ativar.");
    } finally {
      setLoading(false);
    }
  };

  const desativar = async () => {
    setLoading(true);
    setErro(null);
    try {
      await desativarTriangulacao({
        nome_usuario: session?.NomeUsuario ?? "",
        codigo_usuario: session?.Codigo ?? "",
        login_usuario: session?.LoginUsuario ?? "",
      });
      await buscar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao desativar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Gerenciador de Triangulação</h1>
              <p className="text-xs text-slate-500">{session?.NomeUsuario}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge ativa={status.ativa} />
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-rose-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {erro && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Controle de Triangulação
            </h2>
            <div className="flex flex-col items-center gap-6">
              <Countdown segundos={displaySegundos} ativa={status.ativa} />

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={ativar}
                  disabled={status.ativa || loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <Power className="h-4 w-4" />
                  Ativar Triangulação
                </button>
                <button
                  onClick={desativar}
                  disabled={!status.ativa || loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <PowerOff className="h-4 w-4" />
                  Desativar Triangulação
                </button>
              </div>

              <button
                onClick={buscar}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar status
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Regras de Negócio
            </h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <br></br>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  1
                </span>
                <span>
                  Ativação insere os 3 pares: <strong>36→15</strong>, <strong>36→16</strong> e{" "}
                  <strong>50→36</strong>.
                </span>
              </li>
              <br></br>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  2
                </span>
                <span>
                  O temporizador de <strong>10 minutos</strong> é controlado pelo backend
                  (APScheduler).
                </span>
              </li>
              <br></br>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                  3
                </span>
                <span>
                  A desativação (manual ou automática) remove apenas os 3 registros específicos.
                </span>
              </li>
            </ul>
          </section>
        </div>

        <section className="mt-6">
          <TriangulacaoTable dados={status.dados} ativa={status.ativa} />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-4 text-center text-xs text-slate-400">
        Gerenciador de Triangulação de Permissões · tegercontrpedperm
      </footer>
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        <div className="text-slate-400 text-sm">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <ManagementScreen />;
}
