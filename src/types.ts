export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: number | boolean;
  data_criacao: string;
  data_atualizacao: string;
  papeis?: Papel[];
  permissoes?: Permissao[];
  papeis_nomes?: string;
  papeis_ids?: string;
}

export interface TokenClaims {
  id: string;
  email: string;
  nome: string;
  papeis: string[];
  permissoes?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  tokenType: string;
  expiresIn: string;
  usuario: Usuario;
}

export interface Papel {
  id: string;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
  permissoes?: Permissao[];
  permissoes_ids?: string[];
  total_usuarios?: number;
}

export interface Permissao {
  id: string;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
  papeis_associados?: Papel[];
  total_papeis?: number;
}

export interface UsuarioPapel {
  usuario_id: string;
  papel_id: string;
  usuario_nome?: string;
  usuario_email?: string;
  papel_nome?: string;
}

export interface PapelPermissao {
  papel_id: string;
  permissao_id: string;
  papel_nome?: string;
  permissao_nome?: string;
  permissao_descricao?: string;
}

export interface BeneficiarioBPC {
  id: string;
  nome_completo: string;
  cpf: string;
  nis: string;
  tipo_beneficio: 'Idoso (65+)' | 'Pessoa com Deficiência (PCD)';
  bairro_recife: string;
  rpa: number; // 1 a 6
  valor_beneficio: number;
  status: 'Ativo' | 'Suspenso' | 'Em Revisão Cadastral' | 'Bloqueado Temporário';
  data_concessao: string;
  data_nascimento: string;
  cras_referencia: string;
  responsavel_legal?: string;
  data_atualizacao: string;
}

export interface BpcStats {
  total: number;
  totalAtivos: number;
  totalIdosos: number;
  totalPCD: number;
  totalEmRevisao: number;
  totalSuspensos: number;
  valorInjetadoMensal: number;
  rpaStats: {
    rpa: number;
    nome: string;
    total: number;
    valorTotal: number;
  }[];
  bairrosCount: Record<string, number>;
}

export interface DbStatus {
  isConnectedToMySQL: boolean;
  config: {
    host: string;
    port: number;
    user: string;
    database: string;
  };
  lastError: string | null;
  mode: string;
  entityCounts: {
    usuarios: number;
    papeis: number;
    permissoes: number;
    usuario_papel: number;
    papel_permissao: number;
    beneficiarios_bpc: number;
  };
}

export interface DbSchemaResponse {
  sql: string;
  tables: {
    name: string;
    descricao: string;
    colunas: string[];
  }[];
}
