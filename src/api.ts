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
} from './types';

const API_BASE = '/api';

export const api = {
  // Database & Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
  getDbStatus: async (): Promise<DbStatus> => {
    const res = await fetch(`${API_BASE}/db/status`);
    return res.json();
  },
  getDbSchema: async (): Promise<DbSchemaResponse> => {
    const res = await fetch(`${API_BASE}/db/schema`);
    return res.json();
  },
  testDbConnection: async (config: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  }) => {
    const res = await fetch(`${API_BASE}/db/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },
  reseedDb: async () => {
    const res = await fetch(`${API_BASE}/db/reseed`, { method: 'POST' });
    return res.json();
  },

  // Auth & Profile
  login: async (email: string, senha?: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao autenticar');
    }
    return res.json();
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`);
    return res.json();
  },

  // Usuários (usuarios)
  getUsuarios: async (): Promise<Usuario[]> => {
    const res = await fetch(`${API_BASE}/usuarios`);
    return res.json();
  },
  createUsuario: async (data: {
    nome: string;
    email: string;
    senha?: string;
    ativo?: boolean | number;
    papeis_ids?: string[];
  }) => {
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar usuário');
    }
    return res.json();
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
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar usuário');
    }
    return res.json();
  },
  toggleUsuarioStatus: async (id: string, ativo: boolean | number) => {
    const res = await fetch(`${API_BASE}/usuarios/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo }),
    });
    return res.json();
  },
  deleteUsuario: async (id: string) => {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Papéis (papeis)
  getPapeis: async (): Promise<Papel[]> => {
    const res = await fetch(`${API_BASE}/papeis`);
    return res.json();
  },
  createPapel: async (data: { nome: string; descricao: string; permissoes_ids?: string[] }) => {
    const res = await fetch(`${API_BASE}/papeis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar papel');
    }
    return res.json();
  },
  updatePapel: async (
    id: string,
    data: { nome?: string; descricao?: string; permissoes_ids?: string[] }
  ) => {
    const res = await fetch(`${API_BASE}/papeis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deletePapel: async (id: string) => {
    const res = await fetch(`${API_BASE}/papeis/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Permissões (permissoes)
  getPermissoes: async (): Promise<Permissao[]> => {
    const res = await fetch(`${API_BASE}/permissoes`);
    return res.json();
  },
  createPermissao: async (data: { nome: string; descricao: string }) => {
    const res = await fetch(`${API_BASE}/permissoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar permissão');
    }
    return res.json();
  },
  deletePermissao: async (id: string) => {
    const res = await fetch(`${API_BASE}/permissoes/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Relações (usuario_papel & papel_permissao)
  getUsuarioPapel: async (): Promise<UsuarioPapel[]> => {
    const res = await fetch(`${API_BASE}/usuario-papel`);
    return res.json();
  },
  assignUsuarioPapel: async (usuario_id: string, papel_id: string) => {
    const res = await fetch(`${API_BASE}/usuario-papel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id, papel_id }),
    });
    return res.json();
  },
  removeUsuarioPapel: async (usuario_id: string, papel_id: string) => {
    const res = await fetch(`${API_BASE}/usuario-papel?usuario_id=${usuario_id}&papel_id=${papel_id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  getPapelPermissao: async (): Promise<PapelPermissao[]> => {
    const res = await fetch(`${API_BASE}/papel-permissao`);
    return res.json();
  },
  assignPapelPermissao: async (papel_id: string, permissao_id: string) => {
    const res = await fetch(`${API_BASE}/papel-permissao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papel_id, permissao_id }),
    });
    return res.json();
  },
  removePapelPermissao: async (papel_id: string, permissao_id: string) => {
    const res = await fetch(`${API_BASE}/papel-permissao?papel_id=${papel_id}&permissao_id=${permissao_id}`, {
      method: 'DELETE',
    });
    return res.json();
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

    const res = await fetch(`${API_BASE}/beneficiarios?${query.toString()}`);
    return res.json();
  },
  getBeneficiariosStats: async (): Promise<BpcStats> => {
    const res = await fetch(`${API_BASE}/beneficiarios/stats`);
    return res.json();
  },
  createBeneficiario: async (data: Partial<BeneficiarioBPC>) => {
    const res = await fetch(`${API_BASE}/beneficiarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao cadastrar beneficiário');
    }
    return res.json();
  },
  updateBeneficiarioStatus: async (id: string, status: BeneficiarioBPC['status']) => {
    const res = await fetch(`${API_BASE}/beneficiarios/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
  deleteBeneficiario: async (id: string) => {
    const res = await fetch(`${API_BASE}/beneficiarios/${id}`, { method: 'DELETE' });
    return res.json();
  },
};
