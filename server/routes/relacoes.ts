import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dbManager, mockDb } from '../db.js';

export const relacoesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ===================== USUARIO_PAPEL =====================
  // List all usuario_papel relations with rich metadata
  fastify.get('/api/usuario-papel', async (request, reply) => {
    try {
      const items = mockDb.usuario_papel.map((rel) => {
        const usuario = mockDb.usuarios.find((u) => u.id === rel.usuario_id);
        const papel = mockDb.papeis.find((p) => p.id === rel.papel_id);
        return {
          usuario_id: rel.usuario_id,
          papel_id: rel.papel_id,
          usuario_nome: usuario?.nome || 'Desconhecido',
          usuario_email: usuario?.email || '',
          papel_nome: papel?.nome || 'Desconhecido',
        };
      });
      return reply.send(items);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao listar usuario_papel', details: err.message });
    }
  });

  // Assign papel to usuario
  fastify.post('/api/usuario-papel', async (request, reply) => {
    const { usuario_id, papel_id } = request.body as { usuario_id: string; papel_id: string };
    if (!usuario_id || !papel_id) {
      return reply.status(400).send({ error: 'usuario_id e papel_id são obrigatórios.' });
    }

    const exists = mockDb.usuario_papel.some((up) => up.usuario_id === usuario_id && up.papel_id === papel_id);
    if (exists) {
      return reply.status(400).send({ error: 'Este papel já está atribuído a este usuário.' });
    }

    mockDb.usuario_papel.push({ usuario_id, papel_id });

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`INSERT INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)`, [usuario_id, papel_id]);
      } catch (err) {
        console.warn('MySQL insert usuario_papel error:', err);
      }
    }

    return reply.status(201).send({ message: 'Papel atribuído ao usuário com sucesso!' });
  });

  // Remove papel from usuario
  fastify.delete('/api/usuario-papel', async (request, reply) => {
    const { usuario_id, papel_id } = request.query as { usuario_id: string; papel_id: string };
    if (!usuario_id || !papel_id) {
      return reply.status(400).send({ error: 'usuario_id e papel_id são obrigatórios na query string.' });
    }

    mockDb.usuario_papel = mockDb.usuario_papel.filter((up) => !(up.usuario_id === usuario_id && up.papel_id === papel_id));

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`DELETE FROM usuario_papel WHERE usuario_id = ? AND papel_id = ?`, [usuario_id, papel_id]);
      } catch (err) {
        console.warn('MySQL delete usuario_papel error:', err);
      }
    }

    return reply.send({ message: 'Vínculo removido com sucesso!' });
  });

  // ===================== PAPEL_PERMISSAO =====================
  // List all papel_permissao relations
  fastify.get('/api/papel-permissao', async (request, reply) => {
    try {
      const items = mockDb.papel_permissao.map((rel) => {
        const papel = mockDb.papeis.find((p) => p.id === rel.papel_id);
        const permissao = mockDb.permissoes.find((perm) => perm.id === rel.permissao_id);
        return {
          papel_id: rel.papel_id,
          permissao_id: rel.permissao_id,
          papel_nome: papel?.nome || 'Desconhecido',
          permissao_nome: permissao?.nome || 'Desconhecido',
          permissao_descricao: permissao?.descricao || '',
        };
      });
      return reply.send(items);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao listar papel_permissao', details: err.message });
    }
  });

  // Assign permissao to papel
  fastify.post('/api/papel-permissao', async (request, reply) => {
    const { papel_id, permissao_id } = request.body as { papel_id: string; permissao_id: string };
    if (!papel_id || !permissao_id) {
      return reply.status(400).send({ error: 'papel_id e permissao_id são obrigatórios.' });
    }

    const exists = mockDb.papel_permissao.some((pp) => pp.papel_id === papel_id && pp.permissao_id === permissao_id);
    if (exists) {
      return reply.status(400).send({ error: 'Esta permissão já está vinculada a este papel.' });
    }

    mockDb.papel_permissao.push({ papel_id, permissao_id });

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`INSERT INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)`, [papel_id, permissao_id]);
      } catch (err) {
        console.warn('MySQL insert papel_permissao error:', err);
      }
    }

    return reply.status(201).send({ message: 'Permissão vinculada ao papel com sucesso!' });
  });

  // Remove permissao from papel
  fastify.delete('/api/papel-permissao', async (request, reply) => {
    const { papel_id, permissao_id } = request.query as { papel_id: string; permissao_id: string };
    if (!papel_id || !permissao_id) {
      return reply.status(400).send({ error: 'papel_id e permissao_id são obrigatórios na query string.' });
    }

    mockDb.papel_permissao = mockDb.papel_permissao.filter((pp) => !(pp.papel_id === papel_id && pp.permissao_id === permissao_id));

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`DELETE FROM papel_permissao WHERE papel_id = ? AND permissao_id = ?`, [papel_id, permissao_id]);
      } catch (err) {
        console.warn('MySQL delete papel_permissao error:', err);
      }
    }

    return reply.send({ message: 'Permissão desvinculada do papel!' });
  });
};
