import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Network,
} from "lucide-react";
import { postLogin } from "../services/login";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const validar = () => {
    if (!usuario.trim()) return "Informe o usuário.";
    if (!senha) return "Informe a senha.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }

    setLoading(true);
    try {
      const result = await postLogin({
        NomeUsuario: usuario.trim(),
        Senha: senha,
      });

      if (!result.success) {
        const mensagens =
          Array.isArray(result.messages) && result.messages.length
            ? result.messages.join(" ")
            : "Credenciais inválidas.";
        setErro(mensagens);
        return;
      }

      const user = Array.isArray(result.data) ? result.data[0] : null;
      if (!user) {
        setErro("Login retornou sem dados de usuário.");
        return;
      }

      if (!user.SessaoCriada) {
        setErro("Sessão não foi criada. Tente novamente.");
        return;
      }

      login({
        Codigo: user.Codigo,
        NomeUsuario: user.NomeUsuario,
        Empresa: user.Empresa,
        LoginUsuario: user.LoginUsuario,
        ModulosUsuario: user.ModulosUsuario,
        hash: result.hash ?? "",
        tipoLogin: result.tipoLogin ?? "",
      });

      setSucesso("Login realizado com sucesso!");
    } catch {
      setErro("Erro inesperado ao processar o login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
            <Network className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
            Gestão de Triangulação | REPTEC
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Entre com suas credenciais para continuar
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="usuario"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  placeholder="Seu usuário"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="senha"
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  tabIndex={-1}
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}
            {sucesso && (
              <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{sucesso}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium shadow-lg shadow-blue-600/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Acesso restrito a colaboradores autorizados.
        </p>
      </div>
    </div>
  );
}
