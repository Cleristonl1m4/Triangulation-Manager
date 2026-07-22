import { ArrowRight } from "lucide-react";
import type { TriangulacaoRow } from "../types";

interface TriangulacaoTableProps {
  dados: TriangulacaoRow[];
  ativa: boolean;
}

export default function TriangulacaoTable({ dados, ativa }: TriangulacaoTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Regra de Triangulação
        </h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-semibold">Controle Selecionado</th>
            <th className="px-5 py-3 font-semibold">Controle Permitido Alterar No CIGAM</th>
          </tr>
        </thead>
        <tbody>
          {dados.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-5 py-10 text-center text-slate-400">
                {ativa ? "Carregando registros..." : "Nenhum registro — triangulação inativa"}
              </td>
            </tr>
          ) : (
            dados.map((row, idx) => (
              <tr
                key={`${row.controle_selecionado}-${row.controle_permitido_alterar}-${idx}`}
                className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50"
              >
                <td className="px-5 py-3.5 font-medium text-slate-800">{row.controle_selecionado}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    {row.controle_permitido_alterar}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
