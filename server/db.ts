import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  ativo: boolean | number;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Papel {
  id: string;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Permissao {
  id: string;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
}

export interface UsuarioPapel {
  usuario_id: string;
  papel_id: string;
}

export interface PapelPermissao {
  papel_id: string;
  permissao_id: string;
}

/**
 * Converte data para o formato aceito pelo tipo DATETIME do MySQL ('YYYY-MM-DD HH:MM:SS')
 * Evita o erro ER_TRUNCATED_WRONG_VALUE (1292) causado pelo formato ISO-8601 ('T' e 'Z')
 */
export function formatMySQLDateTime(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Converte data para o formato aceito pelo tipo DATE do MySQL ('YYYY-MM-DD')
 */
export function formatMySQLDate(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
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

// In-Memory Storage for immediate preview when MySQL server is not configured/reachable
class MockDatabaseStore {
  usuarios: Usuario[] = [];
  papeis: Papel[] = [];
  permissoes: Permissao[] = [];
  usuario_papel: UsuarioPapel[] = [];
  papel_permissao: PapelPermissao[] = [];
  beneficiarios: BeneficiarioBPC[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    const now = new Date().toISOString();

    // 1. Permissões do Sistema BPC Recife
    this.permissoes = [
      { id: 'perm-1', nome: 'bpc:visualizar', descricao: 'Visualizar lista e detalhes de beneficiários BPC de Recife', data_criacao: now, data_atualizacao: now },
      { id: 'perm-2', nome: 'bpc:cadastrar', descricao: 'Cadastrar novos beneficiários e requerimentos BPC', data_criacao: now, data_atualizacao: now },
      { id: 'perm-3', nome: 'bpc:editar', descricao: 'Atualizar dados cadastrais, CRAS e laudos sociais', data_criacao: now, data_atualizacao: now },
      { id: 'perm-4', nome: 'bpc:suspender', descricao: 'Alterar status de benefício (Suspender/Reativar)', data_criacao: now, data_atualizacao: now },
      { id: 'perm-5', nome: 'bpc:exportar', descricao: 'Exportar relatórios em CSV/PDF para órgãos de controle', data_criacao: now, data_atualizacao: now },
      { id: 'perm-6', nome: 'usuarios:gerenciar', descricao: 'Criar, editar e definir status de usuários do sistema', data_criacao: now, data_atualizacao: now },
      { id: 'perm-7', nome: 'papeis:gerenciar', descricao: 'Gerenciar papéis (roles) e matriz RBAC', data_criacao: now, data_atualizacao: now },
      { id: 'perm-8', nome: 'relatorios:gerenciais', descricao: 'Acesso a métricas orçamentárias e mapas por RPA do Recife', data_criacao: now, data_atualizacao: now },
    ];

    // 2. Papéis
    this.papeis = [
      { id: 'papel-1', nome: 'Administrador Geral', descricao: 'Acesso total a todas as funções, controle de acesso e auditoria', data_criacao: now, data_atualizacao: now },
      { id: 'papel-2', nome: 'Gestor SEMAS Recife', descricao: 'Gestor da Secretaria de Desenvolvimento Social com visão analítica e relatórios', data_criacao: now, data_atualizacao: now },
      { id: 'papel-3', nome: 'Assistente Social CRAS', descricao: 'Operador técnico dos CRAS do Recife para cadastro, acompanhamento e pareceres', data_criacao: now, data_atualizacao: now },
      { id: 'papel-4', nome: 'Auditor Municipal', descricao: 'Consulta e auditoria de pagamentos e conformidade de concessões', data_criacao: now, data_atualizacao: now },
    ];

    // 3. Papel - Permissão
    this.papel_permissao = [
      // Admin tem todas
      { papel_id: 'papel-1', permissao_id: 'perm-1' },
      { papel_id: 'papel-1', permissao_id: 'perm-2' },
      { papel_id: 'papel-1', permissao_id: 'perm-3' },
      { papel_id: 'papel-1', permissao_id: 'perm-4' },
      { papel_id: 'papel-1', permissao_id: 'perm-5' },
      { papel_id: 'papel-1', permissao_id: 'perm-6' },
      { papel_id: 'papel-1', permissao_id: 'perm-7' },
      { papel_id: 'papel-1', permissao_id: 'perm-8' },
      // Gestor SEMAS
      { papel_id: 'papel-2', permissao_id: 'perm-1' },
      { papel_id: 'papel-2', permissao_id: 'perm-5' },
      { papel_id: 'papel-2', permissao_id: 'perm-8' },
      // Assistente Social
      { papel_id: 'papel-3', permissao_id: 'perm-1' },
      { papel_id: 'papel-3', permissao_id: 'perm-2' },
      { papel_id: 'papel-3', permissao_id: 'perm-3' },
      // Auditor
      { papel_id: 'papel-4', permissao_id: 'perm-1' },
      { papel_id: 'papel-4', permissao_id: 'perm-5' },
      { papel_id: 'papel-4', permissao_id: 'perm-8' },
    ];

    // 4. Usuários
    const defaultPasswordHash = bcrypt.hashSync('recife123', 10);
    this.usuarios = [
      {
        id: 'usr-1',
        nome: 'Maria Clara Vasconcelos',
        email: 'admin.bpc@recife.pe.gov.br',
        senha: defaultPasswordHash,
        ativo: 1,
        data_criacao: now,
        data_atualizacao: now,
      },
      {
        id: 'usr-2',
        nome: 'Dr. Roberto Freire Silva',
        email: 'gestor.semas@recife.pe.gov.br',
        senha: defaultPasswordHash,
        ativo: 1,
        data_criacao: now,
        data_atualizacao: now,
      },
      {
        id: 'usr-3',
        nome: 'Aline Barbosa de Andrade',
        email: 'aline.cras.varzea@recife.pe.gov.br',
        senha: defaultPasswordHash,
        ativo: 1,
        data_criacao: now,
        data_atualizacao: now,
      },
      {
        id: 'usr-4',
        nome: 'Carlos Eduardo Maranhão',
        email: 'carlos.cras.ibura@recife.pe.gov.br',
        senha: defaultPasswordHash,
        ativo: 1,
        data_criacao: now,
        data_atualizacao: now,
      },
      {
        id: 'usr-5',
        nome: 'Patrícia Gomes de Albuquerque',
        email: 'auditoria.semas@recife.pe.gov.br',
        senha: defaultPasswordHash,
        ativo: 0,
        data_criacao: now,
        data_atualizacao: now,
      }
    ];

    // 5. Usuário - Papel
    this.usuario_papel = [
      { usuario_id: 'usr-1', papel_id: 'papel-1' },
      { usuario_id: 'usr-2', papel_id: 'papel-2' },
      { usuario_id: 'usr-3', papel_id: 'papel-3' },
      { usuario_id: 'usr-4', papel_id: 'papel-3' },
      { usuario_id: 'usr-5', papel_id: 'papel-4' },
    ];

    // 6. Beneficiários BPC Recife (Exemplos reais das RPAs do Recife)
    this.beneficiarios = [
      {
        id: 'bpc-001',
        nome_completo: 'Severina Maria da Conceição',
        cpf: '124.892.414-02',
        nis: '16283948192',
        tipo_beneficio: 'Idoso (65+)',
        bairro_recife: 'Casa Amarela',
        rpa: 3,
        valor_beneficio: 1412.00,
        status: 'Ativo',
        data_concessao: '2019-04-12',
        data_nascimento: '1952-03-10',
        cras_referencia: 'CRAS Alto Santa Terezinha',
        responsavel_legal: 'Titular',
        data_atualizacao: now,
      },
      {
        id: 'bpc-002',
        nome_completo: 'José Francisco dos Santos Filho',
        cpf: '381.902.774-55',
        nis: '20938491823',
        tipo_beneficio: 'Pessoa com Deficiência (PCD)',
        bairro_recife: 'Várzea',
        rpa: 4,
        valor_beneficio: 1412.00,
        status: 'Ativo',
        data_concessao: '2021-08-20',
        data_nascimento: '1996-11-04',
        cras_referencia: 'CRAS Várzea / CDU',
        responsavel_legal: 'Ana Lúcia dos Santos (Mãe)',
        data_atualizacao: now,
      },
      {
        id: 'bpc-003',
        nome_completo: 'Antônia Lúcia de Arruda',
        cpf: '482.910.334-19',
        nis: '18273940192',
        tipo_beneficio: 'Idoso (65+)',
        bairro_recife: 'Santo Amaro',
        rpa: 1,
        valor_beneficio: 1412.00,
        status: 'Em Revisão Cadastral',
        data_concessao: '2017-02-15',
        data_nascimento: '1948-07-22',
        cras_referencia: 'CRAS Santo Amaro',
        responsavel_legal: 'Titular',
        data_atualizacao: now,
      },
      {
        id: 'bpc-004',
        nome_completo: 'Gabriel Henrique Cavalcanti',
        cpf: '592.103.884-72',
        nis: '21039482910',
        tipo_beneficio: 'Pessoa com Deficiência (PCD)',
        bairro_recife: 'Ibura',
        rpa: 6,
        valor_beneficio: 1412.00,
        status: 'Ativo',
        data_concessao: '2022-01-10',
        data_nascimento: '2004-09-18',
        cras_referencia: 'CRAS Ibura de Cima',
        responsavel_legal: 'Maria Helena Cavalcanti (Avó)',
        data_atualizacao: now,
      },
      {
        id: 'bpc-005',
        nome_completo: 'Manuel Joaquim de Souza Neto',
        cpf: '719.382.004-33',
        nis: '15928374821',
        tipo_beneficio: 'Idoso (65+)',
        bairro_recife: 'Afogados',
        rpa: 5,
        valor_beneficio: 1412.00,
        status: 'Suspenso',
        data_concessao: '2016-11-05',
        data_nascimento: '1950-12-01',
        cras_referencia: 'CRAS Afogados',
        responsavel_legal: 'Titular',
        data_atualizacao: now,
      },
      {
        id: 'bpc-006',
        nome_completo: 'Maria das Dores da Silva Rego',
        cpf: '882.192.404-61',
        nis: '19482739182',
        tipo_beneficio: 'Idoso (65+)',
        bairro_recife: 'Boa Viagem',
        rpa: 6,
        valor_beneficio: 1412.00,
        status: 'Ativo',
        data_concessao: '2020-05-18',
        data_nascimento: '1954-06-30',
        cras_referencia: 'CRAS Pina / Brasília Teimosa',
        responsavel_legal: 'Titular',
        data_atualizacao: now,
      },
      {
        id: 'bpc-007',
        nome_completo: 'Lucas Emanuel de Melo Barbosa',
        cpf: '910.283.474-00',
        nis: '22839481920',
        tipo_beneficio: 'Pessoa com Deficiência (PCD)',
        bairro_recife: 'Campo Grande',
        rpa: 2,
        valor_beneficio: 1412.00,
        status: 'Ativo',
        data_concessao: '2023-03-14',
        data_nascimento: '2010-02-15',
        cras_referencia: 'CRAS Campina do Barreto',
        responsavel_legal: 'Regiane Melo (Mãe)',
        data_atualizacao: now,
      },
      {
        id: 'bpc-008',
        nome_completo: 'Francisca Pereira Chaves',
        cpf: '201.993.414-88',
        nis: '17283910293',
        tipo_beneficio: 'Idoso (65+)',
        bairro_recife: 'Mustardinha',
        rpa: 5,
        valor_beneficio: 1412.00,
        status: 'Bloqueado Temporário',
        data_concessao: '2018-09-09',
        data_nascimento: '1947-10-25',
        cras_referencia: 'CRAS San Martin / Mustardinha',
        responsavel_legal: 'Titular',
        data_atualizacao: now,
      }
    ];
  }
}

export const mockDb = new MockDatabaseStore();

export interface MySQLConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  public isConnectedToMySQL = false;
  public lastError: string | null = null;
  public connectionConfig: MySQLConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bpc_recife_db',
  };

  public getMySQLDDL(): string {
    return `-- =======================================================
-- BANCO DE DADOS: bpc_recife_db
-- PAINEL DE BENEFICIÁRIO BPC DO RECIFE
-- Entidades: usuarios, papeis, permissoes, usuario_papel, papel_permissao
-- =======================================================

CREATE DATABASE IF NOT EXISTS \`bpc_recife_db\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE \`bpc_recife_db\`;

-- 1. Tabela: usuarios
CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`nome\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`senha\` VARCHAR(255) NOT NULL,
  \`ativo\` TINYINT(1) NOT NULL DEFAULT 1,
  \`data_criacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`data_atualizacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_usuarios_email\` (\`email\`),
  INDEX \`idx_usuarios_ativo\` (\`ativo\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabela: papeis
CREATE TABLE IF NOT EXISTS \`papeis\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`nome\` VARCHAR(100) NOT NULL UNIQUE,
  \`descricao\` TEXT NULL,
  \`data_criacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`data_atualizacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabela: permissoes
CREATE TABLE IF NOT EXISTS \`permissoes\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`nome\` VARCHAR(100) NOT NULL UNIQUE,
  \`descricao\` TEXT NULL,
  \`data_criacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`data_atualizacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabela: usuario_papel (Muitos-para-Muitos: Usuários e Papéis)
CREATE TABLE IF NOT EXISTS \`usuario_papel\` (
  \`usuario_id\` VARCHAR(36) NOT NULL,
  \`papel_id\` VARCHAR(36) NOT NULL,
  PRIMARY KEY (\`usuario_id\`, \`papel_id\`),
  CONSTRAINT \`fk_up_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_up_papel\` FOREIGN KEY (\`papel_id\`) REFERENCES \`papeis\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabela: papel_permissao (Muitos-para-Muitos: Papéis e Permissões)
CREATE TABLE IF NOT EXISTS \`papel_permissao\` (
  \`papel_id\` VARCHAR(36) NOT NULL,
  \`permissao_id\` VARCHAR(36) NOT NULL,
  PRIMARY KEY (\`papel_id\`, \`permissao_id\`),
  CONSTRAINT \`fk_pp_papel\` FOREIGN KEY (\`papel_id\`) REFERENCES \`papeis\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_pp_permissao\` FOREIGN KEY (\`permissao_id\`) REFERENCES \`permissoes\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabela: beneficiarios_bpc (Módulo BPC Recife)
CREATE TABLE IF NOT EXISTS \`beneficiarios_bpc\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`nome_completo\` VARCHAR(255) NOT NULL,
  \`cpf\` VARCHAR(14) NOT NULL UNIQUE,
  \`nis\` VARCHAR(11) NOT NULL UNIQUE,
  \`tipo_beneficio\` ENUM('Idoso (65+)', 'Pessoa com Deficiência (PCD)') NOT NULL,
  \`bairro_recife\` VARCHAR(100) NOT NULL,
  \`rpa\` TINYINT NOT NULL,
  \`valor_beneficio\` DECIMAL(10,2) NOT NULL DEFAULT 1412.00,
  \`status\` ENUM('Ativo', 'Suspenso', 'Em Revisão Cadastral', 'Bloqueado Temporário') NOT NULL DEFAULT 'Ativo',
  \`data_concessao\` DATE NOT NULL,
  \`data_nascimento\` DATE NOT NULL,
  \`cras_referencia\` VARCHAR(150) NOT NULL,
  \`responsavel_legal\` VARCHAR(255) NULL,
  \`data_atualizacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_bpc_bairro\` (\`bairro_recife\`),
  INDEX \`idx_bpc_rpa\` (\`rpa\`),
  INDEX \`idx_bpc_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
  }

  public async init(config?: MySQLConfig): Promise<boolean> {
    if (config) {
      this.connectionConfig = { ...this.connectionConfig, ...config };
    }

    try {
      const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
      if (dbUrl && !config) {
        this.pool = mysql.createPool(dbUrl);
      } else {
        this.pool = mysql.createPool({
          host: this.connectionConfig.host,
          port: this.connectionConfig.port,
          user: this.connectionConfig.user,
          password: this.connectionConfig.password,
          database: this.connectionConfig.database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 3000,
        });
      }

      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      // Ensure tables exist on real MySQL
      await this.runDDL();

      this.isConnectedToMySQL = true;
      this.lastError = null;
      console.log(`[MySQL] Conectado com sucesso em ${this.connectionConfig.host}:${this.connectionConfig.port}/${this.connectionConfig.database}`);
      return true;
    } catch (err: any) {
      this.isConnectedToMySQL = false;
      this.lastError = err?.message || 'Falha ao conectar no MySQL. Operando em modo de dados local estruturado.';
      console.log(`[MySQL Info] Servidor MySQL externo não conectado (${this.lastError}). Iniciando com armazenamento em memória com suporte a todo o esquema relacional.`);
      return false;
    }
  }

  private async runDDL() {
    if (!this.pool) return;
    const statements = [
      `CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(36) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        ativo TINYINT(1) NOT NULL DEFAULT 1,
        data_criacao DATETIME NOT NULL,
        data_atualizacao DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS papeis (
        id VARCHAR(36) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        data_criacao DATETIME NOT NULL,
        data_atualizacao DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS permissoes (
        id VARCHAR(36) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        data_criacao DATETIME NOT NULL,
        data_atualizacao DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS usuario_papel (
        usuario_id VARCHAR(36) NOT NULL,
        papel_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (usuario_id, papel_id)
      )`,
      `CREATE TABLE IF NOT EXISTS papel_permissao (
        papel_id VARCHAR(36) NOT NULL,
        permissao_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (papel_id, permissao_id)
      )`,
      `CREATE TABLE IF NOT EXISTS beneficiarios_bpc (
        id VARCHAR(36) PRIMARY KEY,
        nome_completo VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) NOT NULL UNIQUE,
        nis VARCHAR(11) NOT NULL UNIQUE,
        tipo_beneficio VARCHAR(50) NOT NULL,
        bairro_recife VARCHAR(100) NOT NULL,
        rpa INT NOT NULL,
        valor_beneficio DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        data_concessao VARCHAR(20) NOT NULL,
        data_nascimento VARCHAR(20) NOT NULL,
        cras_referencia VARCHAR(150) NOT NULL,
        responsavel_legal VARCHAR(255),
        data_atualizacao DATETIME NOT NULL
      )`
    ];

    for (const sql of statements) {
      try {
        await this.pool.query(sql);
      } catch (e) {
        console.warn('Erro ao criar tabela MySQL:', e);
      }
    }
  }

  // Generic Query Executor with MySQL and Mock fallback
  public async query(sql: string, params: any[] = []): Promise<any> {
    if (this.isConnectedToMySQL && this.pool) {
      try {
        const sanitizedParams = params.map((p) => {
          if (typeof p === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(p)) {
            return formatMySQLDateTime(p);
          }
          return p;
        });
        const [rows] = await this.pool.query(sql, sanitizedParams);
        return rows;
      } catch (err: any) {
        console.error('MySQL Query Error:', err);
        throw err;
      }
    }
    return null;
  }
}

export const dbManager = new DatabaseManager();
