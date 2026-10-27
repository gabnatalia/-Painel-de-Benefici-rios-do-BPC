import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dbManager, mockDb, MySQLConfig } from '../db.js';

export const databaseRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get database status, metrics and entity counts
  fastify.get('/api/db/status', async (request, reply) => {
    let counts = {
      usuarios: mockDb.usuarios.length,
      papeis: mockDb.papeis.length,
      permissoes: mockDb.permissoes.length,
      usuario_papel: mockDb.usuario_papel.length,
      papel_permissao: mockDb.papel_permissao.length,
      beneficiarios_bpc: mockDb.beneficiarios.length,
      paineis: mockDb.paineis.length,
      indicadores: mockDb.indicadores.length,
    };

    if (dbManager.isConnectedToMySQL) {
      try {
        const [u]: any = await dbManager.query('SELECT COUNT(*) as c FROM usuarios');
        const [p]: any = await dbManager.query('SELECT COUNT(*) as c FROM papeis');
        const [per]: any = await dbManager.query('SELECT COUNT(*) as c FROM permissoes');
        const [up]: any = await dbManager.query('SELECT COUNT(*) as c FROM usuario_papel');
        const [pp]: any = await dbManager.query('SELECT COUNT(*) as c FROM papel_permissao');
        const [b]: any = await dbManager.query('SELECT COUNT(*) as c FROM beneficiarios_bpc');
        const [pn]: any = await dbManager.query('SELECT COUNT(*) as c FROM paineis');
        const [ind]: any = await dbManager.query('SELECT COUNT(*) as c FROM indicadores');

        counts = {
          usuarios: Number(u?.c ?? counts.usuarios),
          papeis: Number(p?.c ?? counts.papeis),
          permissoes: Number(per?.c ?? counts.permissoes),
          usuario_papel: Number(up?.c ?? counts.usuario_papel),
          papel_permissao: Number(pp?.c ?? counts.papel_permissao),
          beneficiarios_bpc: Number(b?.c ?? counts.beneficiarios_bpc),
          paineis: Number(pn?.c ?? counts.paineis),
          indicadores: Number(ind?.c ?? counts.indicadores),
        };
      } catch (e) {
        // use fallback mock counts
      }
    }

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
      entityCounts: counts,
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
        {
          name: 'paineis',
          descricao: 'Painéis e módulos temáticos de indicadores sociais de Recife',
          colunas: ['id (PK)', 'nome', 'descricao', 'icone', 'ativo (BOOLEAN)', 'ordem (INT)', 'data_criacao', 'data_atualizacao'],
        },
        {
          name: 'indicadores',
          descricao: 'Métricas e indicadores vinculados a um painel via Chave Estrangeira (1:N)',
          colunas: ['id (PK)', 'painel_id (FK -> paineis.id ON DELETE CASCADE)', 'nome', 'descricao', 'valor', 'tipo', 'variacao', 'ordem (INT)', 'data_criacao', 'data_atualizacao'],
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
    if (dbManager.isConnectedToMySQL) {
      await dbManager.seedMySQL();
    }
    return reply.send({ message: 'Dados de exemplo restaurados e sincronizados com o MySQL com sucesso!' });
  });
};
