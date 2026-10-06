import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'bpc_recife_jwt_secret_key_2026';

export interface TokenPayload {
  id: string;
  email: string;
  nome: string;
  papeis: string[];
  permissoes?: string[];
  iat?: number;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

/**
 * Middleware de Autenticação JWT para o Fastify
 * Protege todas as rotas da API exceto rotas públicas de login e health-check.
 */
export async function authenticateJWT(request: FastifyRequest, reply: FastifyReply) {
  const url = request.raw.url || request.url;

  // Rotas públicas que não requerem token JWT
  if (
    !url.startsWith('/api') ||
    url.startsWith('/api/health') ||
    url.startsWith('/api/auth/login')
  ) {
    return;
  }

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Acesso não autorizado: Token JWT ausente no cabeçalho Authorization (Bearer <token>).',
    });
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    request.user = decoded;
  } catch (err: any) {
    const isExpired = err?.name === 'TokenExpiredError';
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: isExpired
        ? 'Sessão expirada: O token JWT expirou. Por favor, faça login novamente.'
        : 'Token JWT inválido ou corrompido.',
      details: err.message,
    });
  }
}
