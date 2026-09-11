const API_BASE = import.meta.env.VITE_LOGIN_API_URL || 'https://portais.reptec.com.br:4482/api/api/genericos/ge'

export interface LoginUserData {
  Codigo: string
  NomeUsuario: string
  Empresa: string
  LoginUsuario: string
  ModulosUsuario: string
  SessaoCriada: boolean
}

export interface LoginResult {
  success: boolean
  hash?: string
  tipoLogin?: string
  messages?: string[]
  data?: LoginUserData[]
  redirectUrl?: string
}

export async function postLogin({ NomeUsuario, Senha }: { NomeUsuario: string; Senha: string }): Promise<LoginResult> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NomeUsuario, Senha }),
    })
  } catch {
    return {
      success: false,
      messages: ['Não foi possível conectar ao servidor. Verifique sua conexão.'],
    }
  }

  let body: LoginResult
  try {
    body = await res.json()
  } catch {
    return {
      success: false,
      messages: [`Resposta inválida do servidor (status ${res.status}).`],
    }
  }

  if (!res.ok && !body?.success) {
    return {
      success: false,
      messages: body?.messages?.length
        ? body.messages
        : [`Falha no login (status ${res.status}).`],
    }
  }

  return body
}
