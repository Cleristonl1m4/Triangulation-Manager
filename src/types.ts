export interface TriangulacaoRow {
  controle_selecionado: number;
  controle_permitido_alterar: number;
}

export interface TriangulacaoStatus {
  ativa: boolean;
  tempo_restante_segundos: number;
  dados: TriangulacaoRow[];
}

export interface ApiMensagem {
  mensagem: string;
}

export interface UserData {
  nome_usuario: string;
  codigo_usuario: string;
  login_usuario: string;
}
