import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockDb, dbManager } from '../db.js';
import { JWT_SECRET, TokenPayload } from '../middleware/auth.js';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /api/auth/login - Autenticação por credenciais com emissão de JWT
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, senha } = request.body as { email?: string; senha?: string };

    if (!email || !senha) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'E-mail e senha são obrigatórios para autenticação.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = mockDb.usuarios.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Credenciais inválidas: Usuário não encontrado no sistema SEMAS BPC.',
      });
    }

    if (!user.ativo) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Acesso bloqueado: Este usuário está inativo no cadastro da Prefeitura.',
      });
    }

    // Validação da senha com bcrypt e fallback para credenciais de teste 'recife123'
    const passwordMatches = user.senha ? bcrypt.compareSync(senha, user.senha) : false;
    const isMasterDemoPassword = senha === 'recife123';

    if (!passwordMatches && !isMasterDemoPassword) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Credenciais inválidas: Senha incorreta.',
      });
    }

    // Buscar papéis e permissões do usuário
    const papelIds = mockDb.usuario_papel
      .filter((up) => up.usuario_id === user.id)
      .map((up) => up.papel_id);

    const roles = mockDb.papeis.filter((p) => papelIds.includes(p.id));

    const permIds = mockDb.papel_permissao
      .filter((pp) => papelIds.includes(pp.papel_id))
      .map((pp) => pp.permissao_id);

    const permissions = mockDb.permissoes.filter((perm) => permIds.includes(perm.id));

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      papeis: roles.map((r) => r.nome),
      permissoes: permissions.map((p) => p.nome),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '8h',
      algorithm: 'HS256',
    });

    return reply.send({
      message: 'Autenticado com sucesso!',
      token,
      expiresIn: '8h',
      tokenType: 'Bearer',
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        ativo: user.ativo,
        data_criacao: user.data_criacao,
        papeis: roles,
        permissoes: permissions,
      },
    });
  });

  // GET /api/auth/me - Dados do usuário atualmente autenticado via JWT
  fastify.get('/api/auth/me', async (request, reply) => {
    const userPayload = request.user;
    if (!userPayload) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token JWT não fornecido.',
      });
    }

    const user = mockDb.usuarios.find((u) => u.id === userPayload.id);
    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Usuário associado ao token não encontrado.',
      });
    }

    const papelIds = mockDb.usuario_papel
      .filter((up) => up.usuario_id === user.id)
      .map((up) => up.papel_id);

    const roles = mockDb.papeis.filter((p) => papelIds.includes(p.id));

    const permIds = mockDb.papel_permissao
      .filter((pp) => papelIds.includes(pp.papel_id))
      .map((pp) => pp.permissao_id);

    const permissions = mockDb.permissoes.filter((perm) => permIds.includes(perm.id));

    return reply.send({
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        ativo: user.ativo,
        data_criacao: user.data_criacao,
        data_atualizacao: user.data_atualizacao,
        papeis: roles,
        permissoes: permissions,
      },
      tokenClaims: userPayload,
    });
  });

  // POST /api/auth/verify - Verificação explícita de validade do token JWT
  fastify.post('/api/auth/verify', async (request, reply) => {
    return reply.send({
      valid: true,
      user: request.user,
      message: 'Token JWT ativo e válido.',
    });
  });
};
