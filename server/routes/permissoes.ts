import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dbManager, mockDb, Permissao } from '../db.js';

export const permissoesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List all permissions with assigned roles
  fastify.get('/api/permissoes', async (request, reply) => {
    try {
      const result = mockDb.permissoes.map((p) => {
        const papelIds = mockDb.papel_permissao
          .filter((pp) => pp.permissao_id === p.id)
          .map((pp) => pp.papel_id);
        const roles = mockDb.papeis.filter((role) => papelIds.includes(role.id));

        return {
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          data_criacao: p.data_criacao,
          data_atualizacao: p.data_atualizacao,
          papeis_associados: roles,
          total_papeis: roles.length,
        };
      });

      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar permissões', details: err.message });
    }
  });

  // Create permission
  fastify.post('/api/permissoes', async (request, reply) => {
    const body = request.body as { nome: string; descricao: string };
    if (!body.nome) {
      return reply.status(400).send({ error: 'O nome da permissão é obrigatório.' });
    }

    const exists = mockDb.permissoes.some((p) => p.nome.toLowerCase() === body.nome.toLowerCase());
    if (exists) {
      return reply.status(400).send({ error: 'Já existe uma permissão com este identificador.' });
    }

    const now = new Date().toISOString();
    const newPerm: Permissao = {
      id: `perm-${Date.now()}`,
      nome: body.nome,
      descricao: body.descricao || '',
      data_criacao: now,
      data_atualizacao: now,
    };

    mockDb.permissoes.push(newPerm);

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(
          `INSERT INTO permissoes (id, nome, descricao, data_criacao, data_atualizacao) VALUES (?, ?, ?, ?, ?)`,
          [newPerm.id, newPerm.nome, newPerm.descricao, newPerm.data_criacao, newPerm.data_atualizacao]
        );
      } catch (err) {
        console.warn('MySQL insert permissao error:', err);
      }
    }

    return reply.status(201).send({ message: 'Permissão criada com sucesso!', permissao: newPerm });
  });

  // Update permission
  fastify.put('/api/permissoes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { nome?: string; descricao?: string };

    const perm = mockDb.permissoes.find((p) => p.id === id);
    if (!perm) return reply.status(404).send({ error: 'Permissão não encontrada.' });

    const now = new Date().toISOString();
    if (body.nome) perm.nome = body.nome;
    if (body.descricao !== undefined) perm.descricao = body.descricao;
    perm.data_atualizacao = now;

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`UPDATE permissoes SET nome = ?, descricao = ?, data_atualizacao = ? WHERE id = ?`, [
          perm.nome,
          perm.descricao,
          perm.data_atualizacao,
          id,
        ]);
      } catch (err) {
        console.warn('MySQL update permissao error:', err);
      }
    }

    return reply.send({ message: 'Permissão atualizada com sucesso!', permissao: perm });
  });

  // Delete permission
  fastify.delete('/api/permissoes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    mockDb.permissoes = mockDb.permissoes.filter((p) => p.id !== id);
    mockDb.papel_permissao = mockDb.papel_permissao.filter((pp) => pp.permissao_id !== id);

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`DELETE FROM papel_permissao WHERE permissao_id = ?`, [id]);
        await dbManager.query(`DELETE FROM permissoes WHERE id = ?`, [id]);
      } catch (err) {
        console.warn('MySQL delete permissao error:', err);
      }
    }

    return reply.send({ message: 'Permissão removida com sucesso!' });
  });
};
