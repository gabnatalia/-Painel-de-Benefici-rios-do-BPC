import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dbManager, mockDb, Papel } from '../db.js';

export const papeisRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List all roles with associated permissions & user count
  fastify.get('/api/papeis', async (request, reply) => {
    try {
      const result = mockDb.papeis.map((p) => {
        const permIds = mockDb.papel_permissao
          .filter((pp) => pp.papel_id === p.id)
          .map((pp) => pp.permissao_id);
        const permissions = mockDb.permissoes.filter((perm) => permIds.includes(perm.id));
        const userCount = mockDb.usuario_papel.filter((up) => up.papel_id === p.id).length;

        return {
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          data_criacao: p.data_criacao,
          data_atualizacao: p.data_atualizacao,
          permissoes: permissions,
          permissoes_ids: permIds,
          total_usuarios: userCount,
        };
      });

      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar papéis', details: err.message });
    }
  });

  // Get single role
  fastify.get('/api/papeis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const role = mockDb.papeis.find((p) => p.id === id);
    if (!role) return reply.status(404).send({ error: 'Papel não encontrado' });

    const permIds = mockDb.papel_permissao.filter((pp) => pp.papel_id === id).map((pp) => pp.permissao_id);
    const permissions = mockDb.permissoes.filter((perm) => permIds.includes(perm.id));
    return reply.send({ ...role, permissoes: permissions });
  });

  // Create role
  fastify.post('/api/papeis', async (request, reply) => {
    const body = request.body as {
      nome: string;
      descricao: string;
      permissoes_ids?: string[];
    };

    if (!body.nome) {
      return reply.status(400).send({ error: 'O nome do papel é obrigatório.' });
    }

    const exists = mockDb.papeis.some((p) => p.nome.toLowerCase() === body.nome.toLowerCase());
    if (exists) {
      return reply.status(400).send({ error: 'Já existe um papel com este nome.' });
    }

    const now = new Date().toISOString();
    const newId = `papel-${Date.now()}`;
    const newPapel: Papel = {
      id: newId,
      nome: body.nome,
      descricao: body.descricao || '',
      data_criacao: now,
      data_atualizacao: now,
    };

    mockDb.papeis.push(newPapel);

    if (body.permissoes_ids && Array.isArray(body.permissoes_ids)) {
      for (const permId of body.permissoes_ids) {
        mockDb.papel_permissao.push({ papel_id: newId, permissao_id: permId });
      }
    }

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(
          `INSERT INTO papeis (id, nome, descricao, data_criacao, data_atualizacao) VALUES (?, ?, ?, ?, ?)`,
          [newPapel.id, newPapel.nome, newPapel.descricao, newPapel.data_criacao, newPapel.data_atualizacao]
        );
        if (body.permissoes_ids) {
          for (const permId of body.permissoes_ids) {
            await dbManager.query(`INSERT INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)`, [newId, permId]);
          }
        }
      } catch (err) {
        console.warn('Sync MySQL error on create papel:', err);
      }
    }

    return reply.status(201).send({ message: 'Papel criado com sucesso!', papel: newPapel });
  });

  // Update role
  fastify.put('/api/papeis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      nome?: string;
      descricao?: string;
      permissoes_ids?: string[];
    };

    const role = mockDb.papeis.find((p) => p.id === id);
    if (!role) return reply.status(404).send({ error: 'Papel não encontrado.' });

    const now = new Date().toISOString();
    if (body.nome) role.nome = body.nome;
    if (body.descricao !== undefined) role.descricao = body.descricao;
    role.data_atualizacao = now;

    if (body.permissoes_ids && Array.isArray(body.permissoes_ids)) {
      mockDb.papel_permissao = mockDb.papel_permissao.filter((pp) => pp.papel_id !== id);
      for (const permId of body.permissoes_ids) {
        mockDb.papel_permissao.push({ papel_id: id, permissao_id: permId });
      }
    }

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`UPDATE papeis SET nome = ?, descricao = ?, data_atualizacao = ? WHERE id = ?`, [
          role.nome,
          role.descricao,
          role.data_atualizacao,
          id,
        ]);
        if (body.permissoes_ids) {
          await dbManager.query(`DELETE FROM papel_permissao WHERE papel_id = ?`, [id]);
          for (const permId of body.permissoes_ids) {
            await dbManager.query(`INSERT INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)`, [id, permId]);
          }
        }
      } catch (err) {
        console.warn('Sync MySQL error on update papel:', err);
      }
    }

    return reply.send({ message: 'Papel atualizado com sucesso!', papel: role });
  });

  // Delete role
  fastify.delete('/api/papeis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    mockDb.papeis = mockDb.papeis.filter((p) => p.id !== id);
    mockDb.papel_permissao = mockDb.papel_permissao.filter((pp) => pp.papel_id !== id);
    mockDb.usuario_papel = mockDb.usuario_papel.filter((up) => up.papel_id !== id);

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`DELETE FROM papel_permissao WHERE papel_id = ?`, [id]);
        await dbManager.query(`DELETE FROM usuario_papel WHERE papel_id = ?`, [id]);
        await dbManager.query(`DELETE FROM papeis WHERE id = ?`, [id]);
      } catch (err) {
        console.warn('MySQL delete papel error:', err);
      }
    }

    return reply.send({ message: 'Papel removido com sucesso!' });
  });
};
