import { CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  ativa: boolean;
}

export default function StatusBadge({ ativa }: StatusBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        ativa
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-200 text-slate-600"
      }`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {ativa && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            ativa ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      </span>
      {ativa ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Triangulação Ativa
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4" />
          Triangulação Inativa
        </>
      )}
    </div>
  );
}
