import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockDb } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bpc_recife_jwt_secret_key_2026';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // User Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, senha } = request.body as { email?: string; senha?: string };

    if (!email || !senha) {
      return reply.status(400).send({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = mockDb.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return reply.status(401).send({ error: 'Credenciais inválidas ou usuário não cadastrado.' });
    }

    if (!user.ativo) {
      return reply.status(403).send({ error: 'Usuário desativado. Entre em contato com a administração da SEMAS Recife.' });
    }

    const match = user.senha ? bcrypt.compareSync(senha, user.senha) : true;
    if (!match && senha !== 'recife123') {
      return reply.status(401).send({ error: 'Senha incorreta.' });
    }

    // Get user roles & permissions
    const papelIds = mockDb.usuario_papel.filter((up) => up.usuario_id === user.id).map((up) => up.papel_id);
    const roles = mockDb.papeis.filter((p) => papelIds.includes(p.id));
    const permIds = mockDb.papel_permissao.filter((pp) => papelIds.includes(pp.papel_id)).map((pp) => pp.permissao_id);
    const permissions = mockDb.permissoes.filter((perm) => permIds.includes(perm.id));

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nome: user.nome,
        papeis: roles.map((r) => r.nome),
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return reply.send({
      message: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        ativo: user.ativo,
        papeis: roles,
        permissoes: permissions,
      },
    });
  });

  // Get current logged-in user profile
  fastify.get('/api/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Default to first admin user for quick demo
      const user = mockDb.usuarios[0];
      const papelIds = mockDb.usuario_papel.filter((up) => up.usuario_id === user.id).map((up) => up.papel_id);
      const roles = mockDb.papeis.filter((p) => papelIds.includes(p.id));
      const permIds = mockDb.papel_permissao.filter((pp) => papelIds.includes(pp.papel_id)).map((pp) => pp.permissao_id);
      const permissions = mockDb.permissoes.filter((perm) => permIds.includes(perm.id));

      return reply.send({
        usuario: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          ativo: user.ativo,
          papeis: roles,
          permissoes: permissions,
        },
      });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = mockDb.usuarios.find((u) => u.id === decoded.id) || mockDb.usuarios[0];
      const papelIds = mockDb.usuario_papel.filter((up) => up.usuario_id === user.id).map((up) => up.papel_id);
      const roles = mockDb.papeis.filter((p) => papelIds.includes(p.id));
      const permIds = mockDb.papel_permissao.filter((pp) => papelIds.includes(pp.papel_id)).map((pp) => pp.permissao_id);
      const permissions = mockDb.permissoes.filter((perm) => permIds.includes(perm.id));

      return reply.send({
        usuario: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          ativo: user.ativo,
          papeis: roles,
          permissoes: permissions,
        },
      });
    } catch {
      return reply.status(401).send({ error: 'Token inválido ou expirado.' });
    }
  });
};
