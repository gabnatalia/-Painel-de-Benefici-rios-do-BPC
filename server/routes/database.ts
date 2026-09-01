import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dbManager, mockDb, MySQLConfig } from '../db.js';

export const databaseRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get database status, metrics and entity counts
  fastify.get('/api/db/status', async (request, reply) => {
    return reply.send({
      isConnectedToMySQL: dbManager.isConnectedToMySQL,
      config: {
        host: dbManager.connectionConfig.host,
        port: dbManager.connectionConfig.port,
        user: dbManager.connectionConfig.user,
        database: dbManager.connectionConfig.database,
      },
      lastError: dbManager.lastError,
      mode: dbManager.isConnectedToMySQL ? 'MySQL Remoto/Local Ativo' : 'Simulação Relacional em Memória com Validação DDL',
      entityCounts: {
        usuarios: mockDb.usuarios.length,
        papeis: mockDb.papeis.length,
        permissoes: mockDb.permissoes.length,
        usuario_papel: mockDb.usuario_papel.length,
        papel_permissao: mockDb.papel_permissao.length,
        beneficiarios_bpc: mockDb.beneficiarios.length,
      },
    });
  });

  // Get full MySQL DDL SQL schema
  fastify.get('/api/db/schema', async (request, reply) => {
    return reply.send({
      sql: dbManager.getMySQLDDL(),
      tables: [
        {
          name: 'usuarios',
          descricao: 'Cadastro de usuários do painel BPC Recife',
          colunas: ['id (PK)', 'nome', 'email (UNIQUE)', 'senha (HASH)', 'ativo (BOOLEAN)', 'data_criacao', 'data_atualizacao'],
        },
        {
          name: 'papeis',
          descricao: 'Papéis e perfis de acesso no sistema (RBAC)',
          colunas: ['id (PK)', 'nome (UNIQUE)', 'descricao', 'data_criacao', 'data_atualizacao'],
        },
        {
          name: 'permissoes',
          descricao: 'Catálogo de ações permitidas no sistema BPC',
          colunas: ['id (PK)', 'nome (UNIQUE)', 'descricao', 'data_criacao', 'data_atualizacao'],
        },
        {
          name: 'usuario_papel',
          descricao: 'Tabela associativa de Usuários e Papéis (N:N)',
          colunas: ['usuario_id (FK -> usuarios.id)', 'papel_id (FK -> papeis.id)'],
        },
        {
          name: 'papel_permissao',
          descricao: 'Tabela associativa de Papéis e Permissões (N:N)',
          colunas: ['papel_id (FK -> papeis.id)', 'permissao_id (FK -> permissoes.id)'],
        },
        {
          name: 'beneficiarios_bpc',
          descricao: 'Registros de beneficiários BPC (Idosos e PCDs) da cidade do Recife',
          colunas: ['id (PK)', 'nome_completo', 'cpf (UNIQUE)', 'nis (UNIQUE)', 'tipo_beneficio', 'bairro_recife', 'rpa (1-6)', 'valor_beneficio', 'status', 'data_concessao', 'data_nascimento', 'cras_referencia', 'responsavel_legal', 'data_atualizacao'],
        },
      ],
    });
  });

  // Test custom MySQL connection
  fastify.post('/api/db/test-connection', async (request, reply) => {
    const config = request.body as MySQLConfig;
    const success = await dbManager.init(config);
    return reply.send({
      success,
      isConnectedToMySQL: dbManager.isConnectedToMySQL,
      message: success
        ? `Conectado com sucesso ao MySQL (${config.host}:${config.port}/${config.database})`
        : `Não foi possível conectar: ${dbManager.lastError}`,
      lastError: dbManager.lastError,
    });
  });

  // Reseed data
  fastify.post('/api/db/reseed', async (request, reply) => {
    mockDb.seed();
    return reply.send({ message: 'Dados de exemplo restaurados com sucesso!' });
  });
};
