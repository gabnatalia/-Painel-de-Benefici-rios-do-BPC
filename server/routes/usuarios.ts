import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { dbManager, mockDb, Usuario } from '../db.js';

export const usuariosRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List all users with their roles
  fastify.get('/api/usuarios', async (request, reply) => {
    try {
      if (dbManager.isConnectedToMySQL) {
        const users = await dbManager.query(`
          SELECT u.id, u.nome, u.email, u.ativo, u.data_criacao, u.data_atualizacao,
                 GROUP_CONCAT(DISTINCT p.nome) as papeis_nomes,
                 GROUP_CONCAT(DISTINCT p.id) as papeis_ids
          FROM usuarios u
          LEFT JOIN usuario_papel up ON u.id = up.usuario_id
          LEFT JOIN papeis p ON up.papel_id = p.id
          GROUP BY u.id
          ORDER BY u.data_criacao DESC
        `);
        return reply.send(users || []);
      }

      // Fallback in-memory
      const result = mockDb.usuarios.map((u) => {
        const papelIds = mockDb.usuario_papel
          .filter((up) => up.usuario_id === u.id)
          .map((up) => up.papel_id);
        const userRoles = mockDb.papeis.filter((p) => papelIds.includes(p.id));

        return {
          id: u.id,
          nome: u.nome,
          email: u.email,
          ativo: u.ativo,
          data_criacao: u.data_criacao,
          data_atualizacao: u.data_atualizacao,
          papeis: userRoles,
          papeis_nomes: userRoles.map((r) => r.nome).join(','),
          papeis_ids: userRoles.map((r) => r.id).join(','),
        };
      });

      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar usuários', details: err.message });
    }
  });

  // Get single user
  fastify.get('/api/usuarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = mockDb.usuarios.find((u) => u.id === id);
    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' });
    }
    const papelIds = mockDb.usuario_papel.filter((up) => up.usuario_id === id).map((up) => up.papel_id);
    const userRoles = mockDb.papeis.filter((p) => papelIds.includes(p.id));
    return reply.send({ ...user, papeis: userRoles });
  });

  // Create user
  fastify.post('/api/usuarios', async (request, reply) => {
    const body = request.body as {
      nome: string;
      email: string;
      senha?: string;
      ativo?: boolean | number;
      papeis_ids?: string[];
    };

    if (!body.nome || !body.email) {
      return reply.status(400).send({ error: 'Nome e Email são obrigatórios.' });
    }

    const existing = mockDb.usuarios.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (existing) {
      return reply.status(400).send({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const now = new Date().toISOString();
    const newId = `usr-${Date.now()}`;
    const passwordToHash = body.senha || 'recife123';
    const hashedPassword = bcrypt.hashSync(passwordToHash, 10);

    const newUser: Usuario = {
      id: newId,
      nome: body.nome,
      email: body.email,
      senha: hashedPassword,
      ativo: body.ativo !== undefined ? (body.ativo ? 1 : 0) : 1,
      data_criacao: now,
      data_atualizacao: now,
    };

    mockDb.usuarios.push(newUser);

    if (body.papeis_ids && Array.isArray(body.papeis_ids)) {
      for (const papelId of body.papeis_ids) {
        mockDb.usuario_papel.push({ usuario_id: newId, papel_id: papelId });
      }
    }

    // Attempt MySQL sync if connected
    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(
          `INSERT INTO usuarios (id, nome, email, senha, ativo, data_criacao, data_atualizacao) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newUser.id, newUser.nome, newUser.email, newUser.senha, newUser.ativo, newUser.data_criacao, newUser.data_atualizacao]
        );
        if (body.papeis_ids) {
          for (const pid of body.papeis_ids) {
            await dbManager.query(`INSERT INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)`, [newId, pid]);
          }
        }
      } catch (err) {
        console.warn('Sync MySQL error on create user:', err);
      }
    }

    return reply.status(201).send({
      message: 'Usuário cadastrado com sucesso!',
      usuario: { id: newUser.id, nome: newUser.nome, email: newUser.email, ativo: newUser.ativo }
    });
  });

  // Update user
  fastify.put('/api/usuarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      nome?: string;
      email?: string;
      senha?: string;
      ativo?: boolean | number;
      papeis_ids?: string[];
    };

    const index = mockDb.usuarios.findIndex((u) => u.id === id);
    if (index === -1) {
      return reply.status(404).send({ error: 'Usuário não encontrado.' });
    }

    const now = new Date().toISOString();
    const current = mockDb.usuarios[index];

    if (body.nome) current.nome = body.nome;
    if (body.email) current.email = body.email;
    if (body.ativo !== undefined) current.ativo = body.ativo ? 1 : 0;
    if (body.senha) current.senha = bcrypt.hashSync(body.senha, 10);
    current.data_atualizacao = now;

    if (body.papeis_ids && Array.isArray(body.papeis_ids)) {
      // replace relations
      mockDb.usuario_papel = mockDb.usuario_papel.filter((up) => up.usuario_id !== id);
      for (const papelId of body.papeis_ids) {
        mockDb.usuario_papel.push({ usuario_id: id, papel_id: papelId });
      }
    }

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(
          `UPDATE usuarios SET nome = ?, email = ?, ativo = ?, data_atualizacao = ? WHERE id = ?`,
          [current.nome, current.email, current.ativo, current.data_atualizacao, id]
        );
        if (body.papeis_ids) {
          await dbManager.query(`DELETE FROM usuario_papel WHERE usuario_id = ?`, [id]);
          for (const pid of body.papeis_ids) {
            await dbManager.query(`INSERT INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)`, [id, pid]);
          }
        }
      } catch (err) {
        console.warn('Sync MySQL error on update user:', err);
      }
    }

    return reply.send({ message: 'Usuário atualizado com sucesso!', usuario: current });
  });

  // Toggle active status
  fastify.patch('/api/usuarios/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { ativo } = request.body as { ativo: boolean | number };

    const user = mockDb.usuarios.find((u) => u.id === id);
    if (!user) return reply.status(404).send({ error: 'Usuário não encontrado.' });

    user.ativo = ativo ? 1 : 0;
    user.data_atualizacao = new Date().toISOString();

    if (dbManager.isConnectedToMySQL) {
      await dbManager.query(`UPDATE usuarios SET ativo = ?, data_atualizacao = ? WHERE id = ?`, [user.ativo, user.data_atualizacao, id]);
    }

    return reply.send({ message: `Status do usuário atualizado para ${user.ativo ? 'Ativo' : 'Inativo'}`, user });
  });

  // Delete user
  fastify.delete('/api/usuarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    mockDb.usuarios = mockDb.usuarios.filter((u) => u.id !== id);
    mockDb.usuario_papel = mockDb.usuario_papel.filter((up) => up.usuario_id !== id);

    if (dbManager.isConnectedToMySQL) {
      try {
        await dbManager.query(`DELETE FROM usuario_papel WHERE usuario_id = ?`, [id]);
        await dbManager.query(`DELETE FROM usuarios WHERE id = ?`, [id]);
      } catch (err) {
        console.warn('MySQL delete user error:', err);
      }
    }

    return reply.send({ message: 'Usuário removido com sucesso!' });
  });
};
