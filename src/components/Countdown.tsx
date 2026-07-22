interface CountdownProps {
  segundos: number;
  ativa: boolean;
}

function formatar(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Countdown({ segundos, ativa }: CountdownProps) {
  const porcentagem = ativa ? (segundos / 600) * 100 : 0;
  const cor = segundos <= 60 ? "text-rose-600" : "text-slate-700";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-200"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className={ativa ? (segundos <= 60 ? "text-rose-500" : "text-emerald-500") : "text-slate-300"}
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - porcentagem / 100)}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className={`font-mono text-3xl font-bold tabular-nums ${ativa ? cor : "text-slate-400"}`}>
            {ativa ? formatar(segundos) : "--:--"}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            {ativa ? "restante" : "inativo"}
          </span>
        </div>
      </div>
    </div>
  );
}
