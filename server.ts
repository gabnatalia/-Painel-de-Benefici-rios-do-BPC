import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import middie from '@fastify/middie';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import fastifyStatic from '@fastify/static';

import { dbManager } from './server/db.js';
import { authenticateJWT } from './server/middleware/auth.js';
import { authRoutes } from './server/routes/auth.js';
import { usuariosRoutes } from './server/routes/usuarios.js';
import { papeisRoutes } from './server/routes/papeis.js';
import { permissoesRoutes } from './server/routes/permissoes.js';
import { relacoesRoutes } from './server/routes/relacoes.js';
import { beneficiariosRoutes } from './server/routes/beneficiarios.js';
import { databaseRoutes } from './server/routes/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const server = Fastify({
    logger: false,
  });

  const PORT = 3000;
  const HOST = '0.0.0.0';

  // Enable CORS
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Enable middie for express/connect middleware support (Vite integration)
  await server.register(middie);

  // Authenticate all incoming /api endpoints using JWT (except public login & health)
  server.addHook('preHandler', authenticateJWT);

  // Health check
  server.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'Painel de Beneficiário BPC do Recife - Backend Fastify',
      database: dbManager.isConnectedToMySQL ? 'mysql' : 'in-memory-relational-mock',
      timestamp: new Date().toISOString(),
    };
  });

  // Register API routes
  await server.register(authRoutes);
  await server.register(usuariosRoutes);
  await server.register(papeisRoutes);
  await server.register(permissoesRoutes);
  await server.register(relacoesRoutes);
  await server.register(beneficiariosRoutes);
  await server.register(databaseRoutes);

  // Initialize Database connection in background
  dbManager.init().catch((err) => {
    console.log('[DB Init Note]:', err?.message || err);
  });

  // Vite development vs production static handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    server.use((req, res, next) => {
      if (req.url && req.url.startsWith('/api')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    await server.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });
    server.setNotFoundHandler((request, reply) => {
      reply.sendFile('index.html');
    });
  }

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`[Fastify Server] Servidor rodando em http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('Falha ao iniciar servidor Fastify:', err);
    process.exit(1);
  }
}

startServer();
