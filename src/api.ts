import {
  Usuario,
  Papel,
  Permissao,
  UsuarioPapel,
  PapelPermissao,
  BeneficiarioBPC,
  BpcStats,
  DbStatus,
  DbSchemaResponse,
  AuthResponse,
  TokenClaims,
} from './types';

const API_BASE = '/api';
const TOKEN_STORAGE_KEY = 'bpc_recife_jwt_token';

/**
 * Utilitário central de requisições autenticadas com JWT
 * Injeta automaticamente o cabeçalho Authorization: Bearer <token>
 * e trata expiração de token (HTTP 401).
 */
async function requestWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (token && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('bpc:auth_expired'));
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || 'Acesso não autorizado ou sessão JWT expirada.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `Erro HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Gerenciamento de Token JWT no Client
  getToken: (): string | null => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  },
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  },
  clearToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },
  isAuthenticated: (): boolean => {
    return Boolean(typeof window !== 'undefined' && localStorage.getItem(TOKEN_STORAGE_KEY));
  },

  // Auth & Profile
  login: async (email: string, senha?: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Falha ao autenticar.');
    }

    const data: AuthResponse = await res.json();
    if (data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    }
    return data;
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('bpc:auth_logout'));
    }
  },

  getMe: async (): Promise<{ usuario: Usuario; tokenClaims?: TokenClaims }> => {
    return requestWithAuth('/auth/me');
  },

  verifyToken: async (): Promise<{ valid: boolean; user: TokenClaims; message: string }> => {
    return requestWithAuth('/auth/verify', { method: 'POST' });
  },

  // Database & Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  getDbStatus: async (): Promise<DbStatus> => {
    return requestWithAuth('/db/status');
  },

  getDbSchema: async (): Promise<DbSchemaResponse> => {
    return requestWithAuth('/db/schema');
  },

  testDbConnection: async (config: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  }) => {
    return requestWithAuth('/db/test-connection', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  reseedDb: async () => {
    return requestWithAuth('/db/reseed', { method: 'POST' });
  },

  // Usuários (usuarios)
  getUsuarios: async (): Promise<Usuario[]> => {
    return requestWithAuth('/usuarios');
  },

  createUsuario: async (data: {
    nome: string;
    email: string;
    senha?: string;
    ativo?: boolean | number;
    papeis_ids?: string[];
  }) => {
    return requestWithAuth('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUsuario: async (
    id: string,
    data: {
      nome?: string;
      email?: string;
      senha?: string;
      ativo?: boolean | number;
      papeis_ids?: string[];
    }
  ) => {
    return requestWithAuth(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleUsuarioStatus: async (id: string, ativo: boolean | number) => {
    return requestWithAuth(`/usuarios/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    });
  },

  deleteUsuario: async (id: string) => {
    return requestWithAuth(`/usuarios/${id}`, { method: 'DELETE' });
  },

  // Papéis (papeis)
  getPapeis: async (): Promise<Papel[]> => {
    return requestWithAuth('/papeis');
  },

  createPapel: async (data: { nome: string; descricao: string; permissoes_ids?: string[] }) => {
    return requestWithAuth('/papeis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePapel: async (
    id: string,
    data: { nome?: string; descricao?: string; permissoes_ids?: string[] }
  ) => {
    return requestWithAuth(`/papeis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePapel: async (id: string) => {
    return requestWithAuth(`/papeis/${id}`, { method: 'DELETE' });
  },

  // Permissões (permissoes)
  getPermissoes: async (): Promise<Permissao[]> => {
    return requestWithAuth('/permissoes');
  },

  createPermissao: async (data: { nome: string; descricao: string }) => {
    return requestWithAuth('/permissoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deletePermissao: async (id: string) => {
    return requestWithAuth(`/permissoes/${id}`, { method: 'DELETE' });
  },

  // Relações (usuario_papel & papel_permissao)
  getUsuarioPapel: async (): Promise<UsuarioPapel[]> => {
    return requestWithAuth('/usuario-papel');
  },

  assignUsuarioPapel: async (usuario_id: string, papel_id: string) => {
    return requestWithAuth('/usuario-papel', {
      method: 'POST',
      body: JSON.stringify({ usuario_id, papel_id }),
    });
  },

  removeUsuarioPapel: async (usuario_id: string, papel_id: string) => {
    return requestWithAuth(`/usuario-papel?usuario_id=${usuario_id}&papel_id=${papel_id}`, {
      method: 'DELETE',
    });
  },

  getPapelPermissao: async (): Promise<PapelPermissao[]> => {
    return requestWithAuth('/papel-permissao');
  },

  assignPapelPermissao: async (papel_id: string, permissao_id: string) => {
    return requestWithAuth('/papel-permissao', {
      method: 'POST',
      body: JSON.stringify({ papel_id, permissao_id }),
    });
  },

  removePapelPermissao: async (papel_id: string, permissao_id: string) => {
    return requestWithAuth(`/papel-permissao?papel_id=${papel_id}&permissao_id=${permissao_id}`, {
      method: 'DELETE',
    });
  },

  // Beneficiários BPC Recife
  getBeneficiarios: async (params?: {
    search?: string;
    bairro?: string;
    rpa?: string;
    tipo?: string;
    status?: string;
  }): Promise<{ total: number; items: BeneficiarioBPC[] }> => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.bairro) query.set('bairro', params.bairro);
    if (params?.rpa) query.set('rpa', params.rpa);
    if (params?.tipo) query.set('tipo', params.tipo);
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return requestWithAuth(`/beneficiarios${queryString}`);
  },

  getBeneficiariosStats: async (): Promise<BpcStats> => {
    return requestWithAuth('/beneficiarios/stats');
  },

  createBeneficiario: async (data: Partial<BeneficiarioBPC>) => {
    return requestWithAuth('/beneficiarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBeneficiarioStatus: async (id: string, status: BeneficiarioBPC['status']) => {
    return requestWithAuth(`/beneficiarios/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteBeneficiario: async (id: string) => {
    return requestWithAuth(`/beneficiarios/${id}`, { method: 'DELETE' });
  },
};
