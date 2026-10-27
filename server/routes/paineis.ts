import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dbManager, mockDb, Painel, Indicador, formatMySQLDateTime } from '../db.js';

export const paineisRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ==========================================
  // ROTAS DE PAINÉIS (/api/paineis)
  // ==========================================

  // Listar todos os painéis com seus indicadores vinculados
  fastify.get('/api/paineis', async (request, reply) => {
    try {
      if (dbManager.isConnectedToMySQL) {
        const rowsPaineis: any = await dbManager.query(
          'SELECT * FROM paineis ORDER BY ordem ASC, data_criacao ASC'
        );
        const rowsIndicadores: any = await dbManager.query(
          'SELECT * FROM indicadores ORDER BY ordem ASC, data_criacao ASC'
        );

        const result = (rowsPaineis || []).map((p: any) => {
          const inds = (rowsIndicadores || []).filter((i: any) => i.painel_id === p.id);
          return {
            ...p,
            ativo: Boolean(p.ativo),
            indicadores: inds,
            total_indicadores: inds.length,
          };
        });

        return reply.send(result);
      }

      const result = mockDb.paineis.map((p) => {
        const inds = mockDb.indicadores.filter((i) => i.painel_id === p.id);
        return {
          ...p,
          ativo: Boolean(p.ativo),
          indicadores: inds,
          total_indicadores: inds.length,
        };
      });

      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar painéis', details: err.message });
    }
  });

  // Obter detalhes de um painel específico e seus indicadores
  fastify.get('/api/paineis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      if (dbManager.isConnectedToMySQL) {
        const rows: any = await dbManager.query('SELECT * FROM paineis WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
          return reply.status(404).send({ error: `Painel '${id}' não encontrado.` });
        }
        const painel = rows[0];
        const inds: any = await dbManager.query(
          'SELECT * FROM indicadores WHERE painel_id = ? ORDER BY ordem ASC, data_criacao ASC',
          [id]
        );
        return reply.send({
          ...painel,
          ativo: Boolean(painel.ativo),
          indicadores: inds || [],
          total_indicadores: (inds || []).length,
        });
      }

      const painel = mockDb.paineis.find((p) => p.id === id);
      if (!painel) {
        return reply.status(404).send({ error: `Painel '${id}' não encontrado.` });
      }

      const inds = mockDb.indicadores.filter((i) => i.painel_id === id);
      return reply.send({
        ...painel,
        ativo: Boolean(painel.ativo),
        indicadores: inds,
        total_indicadores: inds.length,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar painel', details: err.message });
    }
  });

  // Criar um novo painel
  fastify.post('/api/paineis', async (request, reply) => {
    const body = (request.body || {}) as {
      nome?: string;
      name?: string;
      descricao?: string;
      description?: string;
      icone?: string;
      ativo?: boolean | number;
      ordem?: number;
    };

    const nome = (body.nome || body.name)?.trim();
    const descricao = (body.descricao || body.description || '').trim();
    const icone = (body.icone || 'LayoutDashboard').trim();
    const ativo = body.ativo === false || body.ativo === 0 ? 0 : 1;
    const ordem = typeof body.ordem === 'number' ? body.ordem : mockDb.paineis.length + 1;

    if (!nome) {
      return reply.status(400).send({
        error: 'O nome do painel é obrigatório.',
        exemploCorreto: {
          nome: 'Painel Executivo BPC Recife',
          descricao: 'Métricas gerais da Secretaria de Desenvolvimento Social',
          icone: 'LayoutDashboard',
          ativo: 1,
          ordem: 1,
        },
      });
    }

    const nowIso = new Date().toISOString();
    const newId = `painel-${Date.now()}`;

    const novoPainel: Painel = {
      id: newId,
      nome,
      descricao: descricao || undefined,
      icone,
      ativo,
      ordem,
      data_criacao: nowIso,
      data_atualizacao: nowIso,
    };

    try {
      if (dbManager.isConnectedToMySQL) {
        await dbManager.query(
          `INSERT INTO paineis (id, nome, descricao, icone, ativo, ordem, data_criacao, data_atualizacao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            novoPainel.id,
            novoPainel.nome,
            novoPainel.descricao || null,
            novoPainel.icone || 'LayoutDashboard',
            novoPainel.ativo ? 1 : 0,
            novoPainel.ordem,
            formatMySQLDateTime(novoPainel.data_criacao),
            formatMySQLDateTime(novoPainel.data_atualizacao),
          ]
        );
      }

      mockDb.paineis.push(novoPainel);
      return reply.status(201).send({
        message: 'Painel criado com sucesso na tabela paineis!',
        painel: novoPainel,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao criar painel no MySQL', details: err.message });
    }
  });

  // Atualizar painel
  fastify.put('/api/paineis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body || {}) as Partial<Painel>;
    const nowIso = new Date().toISOString();

    try {
      if (dbManager.isConnectedToMySQL) {
        const rows: any = await dbManager.query('SELECT * FROM paineis WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
          return reply.status(404).send({ error: 'Painel não encontrado.' });
        }
        const current = rows[0];
        const updated = {
          nome: body.nome !== undefined ? body.nome.trim() : current.nome,
          descricao: body.descricao !== undefined ? body.descricao.trim() : current.descricao,
          icone: body.icone !== undefined ? body.icone.trim() : current.icone,
          ativo: body.ativo !== undefined ? (body.ativo ? 1 : 0) : current.ativo,
          ordem: body.ordem !== undefined ? body.ordem : current.ordem,
          data_atualizacao: formatMySQLDateTime(nowIso),
        };

        await dbManager.query(
          `UPDATE paineis SET nome = ?, descricao = ?, icone = ?, ativo = ?, ordem = ?, data_atualizacao = ? WHERE id = ?`,
          [updated.nome, updated.descricao, updated.icone, updated.ativo, updated.ordem, updated.data_atualizacao, id]
        );

        return reply.send({ message: 'Painel atualizado com sucesso!', painel: { id, ...updated } });
      }

      const idx = mockDb.paineis.findIndex((p) => p.id === id);
      if (idx === -1) {
        return reply.status(404).send({ error: 'Painel não encontrado.' });
      }

      mockDb.paineis[idx] = {
        ...mockDb.paineis[idx],
        ...body,
        data_atualizacao: nowIso,
      };

      return reply.send({ message: 'Painel atualizado com sucesso!', painel: mockDb.paineis[idx] });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao atualizar painel', details: err.message });
    }
  });

  // Excluir painel (apaga em cascata todos os indicadores relacionados por causa da Foreign Key ON DELETE CASCADE)
  fastify.delete('/api/paineis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      if (dbManager.isConnectedToMySQL) {
        await dbManager.query('DELETE FROM paineis WHERE id = ?', [id]);
      }

      mockDb.paineis = mockDb.paineis.filter((p) => p.id !== id);
      mockDb.indicadores = mockDb.indicadores.filter((i) => i.painel_id !== id);

      return reply.send({
        success: true,
        message: `Painel '${id}' e todos os seus indicadores vinculados foram removidos com sucesso (CASCADE)!`,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao excluir painel', details: err.message });
    }
  });

  // ==========================================
  // ROTAS DE INDICADORES (/api/indicadores)
  // ==========================================

  // Listar indicadores (com filtro opcional ?painel_id=...)
  fastify.get('/api/indicadores', async (request, reply) => {
    const { painel_id } = request.query as { painel_id?: string };

    try {
      if (dbManager.isConnectedToMySQL) {
        let sql = `
          SELECT i.*, p.nome as painel_nome
          FROM indicadores i
          JOIN paineis p ON i.painel_id = p.id
        `;
        const params: any[] = [];
        if (painel_id) {
          sql += ' WHERE i.painel_id = ?';
          params.push(painel_id);
        }
        sql += ' ORDER BY i.painel_id ASC, i.ordem ASC';

        const rows: any = await dbManager.query(sql, params);
        return reply.send(rows || []);
      }

      let filtered = mockDb.indicadores;
      if (painel_id) {
        filtered = filtered.filter((i) => i.painel_id === painel_id);
      }

      const result = filtered.map((ind) => {
        const p = mockDb.paineis.find((pn) => pn.id === ind.painel_id);
        return {
          ...ind,
          painel_nome: p?.nome || 'Painel não especificado',
        };
      });

      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao listar indicadores', details: err.message });
    }
  });

  // Obter único indicador por ID
  fastify.get('/api/indicadores/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      if (dbManager.isConnectedToMySQL) {
        const rows: any = await dbManager.query(
          `SELECT i.*, p.nome as painel_nome
           FROM indicadores i
           JOIN paineis p ON i.painel_id = p.id
           WHERE i.id = ?`,
          [id]
        );
        if (!rows || rows.length === 0) {
          return reply.status(404).send({ error: 'Indicador não encontrado.' });
        }
        return reply.send(rows[0]);
      }

      const ind = mockDb.indicadores.find((i) => i.id === id);
      if (!ind) {
        return reply.status(404).send({ error: 'Indicador não encontrado.' });
      }

      const p = mockDb.paineis.find((pn) => pn.id === ind.painel_id);
      return reply.send({
        ...ind,
        painel_nome: p?.nome || 'Painel',
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar indicador', details: err.message });
    }
  });

  // Criar um novo indicador (valida chave estrangeira painel_id -> paineis.id)
  fastify.post('/api/indicadores', async (request, reply) => {
    const body = (request.body || {}) as {
      painel_id?: string;
      painelId?: string;
      nome?: string;
      name?: string;
      descricao?: string;
      description?: string;
      valor?: string | number;
      value?: string | number;
      tipo?: string;
      type?: string;
      variacao?: string;
      variation?: string;
      ordem?: number;
    };

    const painel_id = (body.painel_id || body.painelId)?.trim();
    const nome = (body.nome || body.name)?.trim();
    const descricao = (body.descricao || body.description || '').trim();
    const valor = String(body.valor !== undefined ? body.valor : body.value !== undefined ? body.value : '').trim();
    const tipo = (body.tipo || body.type || 'numero').trim();
    const variacao = (body.variacao || body.variation || '').trim();
    const ordem = typeof body.ordem === 'number' ? body.ordem : 1;

    // 1. Validação de campos obrigatórios
    if (!painel_id) {
      return reply.status(400).send({
        error: "O campo 'painel_id' é obrigatório. Cada indicador deve pertencer a um painel (Foreign Key).",
        paineisDisponiveis: mockDb.paineis.map((p) => ({ id: p.id, nome: p.nome })),
      });
    }

    if (!nome) {
      return reply.status(400).send({
        error: "O campo 'nome' do indicador é obrigatório.",
      });
    }

    if (!valor) {
      return reply.status(400).send({
        error: "O campo 'valor' do indicador é obrigatório (ex: '8.432', 'R$ 11.905.984,00', '96.3%').",
      });
    }

    // 2. Validação da Chave Estrangeira (Verificar se o painel_id existe na tabela paineis)
    let painelExiste = false;
    let painelNome = '';

    if (dbManager.isConnectedToMySQL) {
      const pRows: any = await dbManager.query('SELECT id, nome FROM paineis WHERE id = ?', [painel_id]);
      painelExiste = pRows && pRows.length > 0;
      if (painelExiste) painelNome = pRows[0].nome;
    } else {
      const p = mockDb.paineis.find((pn) => pn.id === painel_id);
      painelExiste = Boolean(p);
      if (p) painelNome = p.nome;
    }

    if (!painelExiste) {
      return reply.status(400).send({
        error: `Erro de integridade referencial: O painel com id '${painel_id}' não existe na tabela 'paineis'.`,
        detalhe: 'A chave estrangeira fk_indicadores_painel exige que o painel_id exista previamente na tabela paineis.',
        paineisDisponiveis: mockDb.paineis.map((p) => ({ id: p.id, nome: p.nome })),
      });
    }

    const nowIso = new Date().toISOString();
    const newId = `ind-${Date.now()}`;

    const novoIndicador: Indicador = {
      id: newId,
      painel_id,
      nome,
      descricao: descricao || undefined,
      valor,
      tipo,
      variacao: variacao || undefined,
      ordem,
      data_criacao: nowIso,
      data_atualizacao: nowIso,
    };

    try {
      if (dbManager.isConnectedToMySQL) {
        await dbManager.query(
          `INSERT INTO indicadores (id, painel_id, nome, descricao, valor, tipo, variacao, ordem, data_criacao, data_atualizacao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            novoIndicador.id,
            novoIndicador.painel_id,
            novoIndicador.nome,
            novoIndicador.descricao || null,
            novoIndicador.valor,
            novoIndicador.tipo,
            novoIndicador.variacao || null,
            novoIndicador.ordem,
            formatMySQLDateTime(novoIndicador.data_criacao),
            formatMySQLDateTime(novoIndicador.data_atualizacao),
          ]
        );
      }

      mockDb.indicadores.push(novoIndicador);
      return reply.status(201).send({
        message: 'Indicador criado com sucesso vinculado ao painel!',
        indicador: {
          ...novoIndicador,
          painel_nome: painelNome,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao criar indicador no banco', details: err.message });
    }
  });

  // Atualizar indicador
  fastify.put('/api/indicadores/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body || {}) as Partial<Indicador>;
    const nowIso = new Date().toISOString();

    try {
      // Se estiver alterando painel_id, validar existência
      if (body.painel_id) {
        let pExists = false;
        if (dbManager.isConnectedToMySQL) {
          const check: any = await dbManager.query('SELECT id FROM paineis WHERE id = ?', [body.painel_id]);
          pExists = check && check.length > 0;
        } else {
          pExists = mockDb.paineis.some((pn) => pn.id === body.painel_id);
        }
        if (!pExists) {
          return reply.status(400).send({
            error: `O painel informado '${body.painel_id}' não existe. Chave estrangeira violada.`,
          });
        }
      }

      if (dbManager.isConnectedToMySQL) {
        const rows: any = await dbManager.query('SELECT * FROM indicadores WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
          return reply.status(404).send({ error: 'Indicador não encontrado.' });
        }
        const current = rows[0];
        const updated = {
          painel_id: body.painel_id !== undefined ? body.painel_id : current.painel_id,
          nome: body.nome !== undefined ? body.nome.trim() : current.nome,
          descricao: body.descricao !== undefined ? body.descricao.trim() : current.descricao,
          valor: body.valor !== undefined ? String(body.valor).trim() : current.valor,
          tipo: body.tipo !== undefined ? body.tipo : current.tipo,
          variacao: body.variacao !== undefined ? body.variacao : current.variacao,
          ordem: body.ordem !== undefined ? body.ordem : current.ordem,
          data_atualizacao: formatMySQLDateTime(nowIso),
        };

        await dbManager.query(
          `UPDATE indicadores SET painel_id = ?, nome = ?, descricao = ?, valor = ?, tipo = ?, variacao = ?, ordem = ?, data_atualizacao = ? WHERE id = ?`,
          [
            updated.painel_id,
            updated.nome,
            updated.descricao,
            updated.valor,
            updated.tipo,
            updated.variacao,
            updated.ordem,
            updated.data_atualizacao,
            id,
          ]
        );

        return reply.send({ message: 'Indicador atualizado com sucesso!', indicador: { id, ...updated } });
      }

      const idx = mockDb.indicadores.findIndex((i) => i.id === id);
      if (idx === -1) {
        return reply.status(404).send({ error: 'Indicador não encontrado.' });
      }

      mockDb.indicadores[idx] = {
        ...mockDb.indicadores[idx],
        ...body,
        data_atualizacao: nowIso,
      };

      return reply.send({ message: 'Indicador atualizado com sucesso!', indicador: mockDb.indicadores[idx] });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao atualizar indicador', details: err.message });
    }
  });

  // Excluir indicador
  fastify.delete('/api/indicadores/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      if (dbManager.isConnectedToMySQL) {
        await dbManager.query('DELETE FROM indicadores WHERE id = ?', [id]);
      }

      mockDb.indicadores = mockDb.indicadores.filter((i) => i.id !== id);

      return reply.send({ success: true, message: `Indicador '${id}' excluído com sucesso!` });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao excluir indicador', details: err.message });
    }
  });
};
