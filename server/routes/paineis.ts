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
        let rowsIndicadores: any[] = [];
        try {
          rowsIndicadores = (await dbManager.query(
            'SELECT * FROM indicador ORDER BY data_criacao ASC'
          )) || [];
        } catch (e) {
          rowsIndicadores = (await dbManager.query(
            'SELECT * FROM indicadores ORDER BY ordem ASC, data_criacao ASC'
          )) || [];
        }

        const result = (rowsPaineis || []).map((p: any) => {
          const inds = (rowsIndicadores || []).filter(
            (i: any) => i.painelId === p.id || i.painel_id === p.id
          );
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
        const inds = mockDb.indicadores.filter(
          (i) => i.painelId === p.id || i.painel_id === p.id
        );
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
        let inds: any[] = [];
        try {
          inds = (await dbManager.query(
            'SELECT * FROM indicador WHERE painelId = ? ORDER BY data_criacao ASC',
            [id]
          )) || [];
        } catch (e) {
          inds = (await dbManager.query(
            'SELECT * FROM indicadores WHERE (painel_id = ? OR painelId = ?) ORDER BY ordem ASC, data_criacao ASC',
            [id, id]
          )) || [];
        }
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

      const inds = mockDb.indicadores.filter((i) => i.painelId === id || i.painel_id === id);
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
  // ROTAS DE INDICADOR / INDICADORES
  // Suporta tanto /api/indicador quanto /api/indicadores
  // Campos da tabela indicador: id, nome, descricao, unidade, fonte, painelId
  // ==========================================

  const getIndicadoresHandler = async (request: any, reply: any) => {
    const query = request.query as { painelId?: string; painel_id?: string };
    const pId = query.painelId || query.painel_id;

    try {
      if (dbManager.isConnectedToMySQL) {
        // Tenta buscar da tabela 'indicador' primeiro, com fallback para 'indicadores'
        let rows: any[] = [];
        try {
          let sql = `
            SELECT i.id, i.nome, i.descricao, i.unidade, i.fonte, i.painelId, i.data_criacao, i.data_atualizacao,
                   p.nome as painel_nome
            FROM indicador i
            JOIN paineis p ON i.painelId = p.id
          `;
          const params: any[] = [];
          if (pId) {
            sql += ' WHERE i.painelId = ?';
            params.push(pId);
          }
          sql += ' ORDER BY i.data_criacao ASC';
          rows = (await dbManager.query(sql, params)) || [];
        } catch (e) {
          // Fallback para indicadores
          let sql = `
            SELECT i.*, p.nome as painel_nome
            FROM indicadores i
            JOIN paineis p ON (i.painel_id = p.id OR i.painelId = p.id)
          `;
          const params: any[] = [];
          if (pId) {
            sql += ' WHERE (i.painel_id = ? OR i.painelId = ?)';
            params.push(pId, pId);
          }
          sql += ' ORDER BY i.data_criacao ASC';
          rows = (await dbManager.query(sql, params)) || [];
        }

        const normalized = rows.map((r) => ({
          ...r,
          painelId: r.painelId || r.painel_id,
          painel_id: r.painelId || r.painel_id,
        }));
        return reply.send(normalized);
      }

      let filtered = mockDb.indicadores;
      if (pId) {
        filtered = filtered.filter((i) => (i.painelId === pId || i.painel_id === pId));
      }

      const result = filtered.map((ind) => {
        const p = mockDb.paineis.find((pn) => pn.id === (ind.painelId || ind.painel_id));
        const finalPainelId = ind.painelId || ind.painel_id || '';
        return {
          id: ind.id,
          nome: ind.nome,
          descricao: ind.descricao || null,
          unidade: ind.unidade || 'unidade',
          fonte: ind.fonte || 'SEMAS Recife',
          painelId: finalPainelId,
          painel_id: finalPainelId,
          valor: ind.valor || '',
          tipo: ind.tipo || 'numero',
          variacao: ind.variacao || '',
          ordem: ind.ordem || 0,
          data_criacao: ind.data_criacao,
          data_atualizacao: ind.data_atualizacao,
          painel_nome: p?.nome || 'Painel',
        };
      });

      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao listar indicadores', details: err.message });
    }
  };

  fastify.get('/api/indicador', getIndicadoresHandler);
  fastify.get('/api/indicadores', getIndicadoresHandler);

  // Obter único indicador por ID
  const getIndicadorByIdHandler = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };

    try {
      if (dbManager.isConnectedToMySQL) {
        let indRow: any = null;
        try {
          const rows: any = await dbManager.query(
            `SELECT i.id, i.nome, i.descricao, i.unidade, i.fonte, i.painelId, i.data_criacao, i.data_atualizacao,
                    p.nome as painel_nome
             FROM indicador i
             JOIN paineis p ON i.painelId = p.id
             WHERE i.id = ?`,
            [id]
          );
          if (rows && rows.length > 0) indRow = rows[0];
        } catch (e) {
          // fallback
        }

        if (!indRow) {
          const rows: any = await dbManager.query(
            `SELECT i.*, p.nome as painel_nome
             FROM indicadores i
             JOIN paineis p ON (i.painel_id = p.id OR i.painelId = p.id)
             WHERE i.id = ?`,
            [id]
          );
          if (rows && rows.length > 0) indRow = rows[0];
        }

        if (!indRow) {
          return reply.status(404).send({ error: `Indicador '${id}' não encontrado.` });
        }

        return reply.send({
          ...indRow,
          painelId: indRow.painelId || indRow.painel_id,
          painel_id: indRow.painelId || indRow.painel_id,
        });
      }

      const ind = mockDb.indicadores.find((i) => i.id === id);
      if (!ind) {
        return reply.status(404).send({ error: `Indicador '${id}' não encontrado.` });
      }

      const finalPainelId = ind.painelId || ind.painel_id || '';
      const p = mockDb.paineis.find((pn) => pn.id === finalPainelId);
      return reply.send({
        id: ind.id,
        nome: ind.nome,
        descricao: ind.descricao || null,
        unidade: ind.unidade || 'unidade',
        fonte: ind.fonte || 'SEMAS Recife',
        painelId: finalPainelId,
        painel_id: finalPainelId,
        valor: ind.valor || '',
        tipo: ind.tipo || 'numero',
        variacao: ind.variacao || '',
        ordem: ind.ordem || 0,
        data_criacao: ind.data_criacao,
        data_atualizacao: ind.data_atualizacao,
        painel_nome: p?.nome || 'Painel',
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar indicador', details: err.message });
    }
  };

  fastify.get('/api/indicador/:id', getIndicadorByIdHandler);
  fastify.get('/api/indicadores/:id', getIndicadorByIdHandler);

  // Criar um novo indicador (campos da tabela indicador: id, nome, descricao, unidade, fonte, painelId)
  const createIndicadorHandler = async (request: any, reply: any) => {
    const body = (request.body || {}) as {
      painelId?: string;
      painel_id?: string;
      nome?: string;
      name?: string;
      descricao?: string;
      description?: string;
      unidade?: string;
      unit?: string;
      fonte?: string;
      source?: string;
      valor?: string | number;
      value?: string | number;
      tipo?: string;
      variacao?: string;
      ordem?: number;
    };

    const painelId = (body.painelId || body.painel_id)?.trim();
    const nome = (body.nome || body.name)?.trim();
    const descricao = (body.descricao || body.description || '').trim();
    const unidade = (body.unidade || body.unit || 'unidade').trim();
    const fonte = (body.fonte || body.source || 'SEMAS Recife / CadÚnico').trim();
    const valor = body.valor !== undefined ? String(body.valor).trim() : body.value !== undefined ? String(body.value).trim() : '';
    const tipo = (body.tipo || 'numero').trim();
    const variacao = (body.variacao || '').trim();
    const ordem = typeof body.ordem === 'number' ? body.ordem : mockDb.indicadores.length + 1;

    // 1. Validação de campos obrigatórios
    if (!painelId) {
      return reply.status(400).send({
        error: "O campo 'painelId' é obrigatório. Cada indicador deve pertencer a um painel (Chave Estrangeira fk_indicador_painel -> paineis.id).",
        camposEsperados: {
          id: 'opcional (gerado automaticamente)',
          nome: 'obrigatório (ex: "Taxa de Regularidade BPC")',
          descricao: 'opcional (detalhamento da métrica)',
          unidade: 'opcional (ex: "%", "Beneficiários", "R$")',
          fonte: 'opcional (ex: "SEMAS Recife / CadÚnico")',
          painelId: 'obrigatório (ID do painel na tabela paineis)',
        },
        paineisDisponiveis: mockDb.paineis.map((p) => ({ id: p.id, nome: p.nome })),
      });
    }

    if (!nome) {
      return reply.status(400).send({
        error: "O campo 'nome' do indicador é obrigatório.",
        exemploCorreto: {
          nome: 'Novos Beneficiários BPC Cadastrados',
          descricao: 'Total de requerimentos deferidos no último trimestre',
          unidade: 'Beneficiários',
          fonte: 'SEMAS Recife / INSS',
          painelId: painelId || 'painel-1',
        },
      });
    }

    // 2. Validação da Chave Estrangeira (Verificar se painelId existe na tabela paineis)
    let painelExiste = false;
    let painelNome = '';

    if (dbManager.isConnectedToMySQL) {
      const pRows: any = await dbManager.query('SELECT id, nome FROM paineis WHERE id = ?', [painelId]);
      painelExiste = pRows && pRows.length > 0;
      if (painelExiste) painelNome = pRows[0].nome;
    } else {
      const p = mockDb.paineis.find((pn) => pn.id === painelId);
      painelExiste = Boolean(p);
      if (p) painelNome = p.nome;
    }

    if (!painelExiste) {
      return reply.status(400).send({
        error: `Erro de integridade referencial: O painel com id '${painelId}' não existe na tabela 'paineis'.`,
        detalhe: 'A chave estrangeira fk_indicador_painel exige que painelId exista na tabela paineis.',
        paineisDisponiveis: mockDb.paineis.map((p) => ({ id: p.id, nome: p.nome })),
      });
    }

    const nowIso = new Date().toISOString();
    const newId = `ind-${Date.now()}`;

    const novoIndicador: Indicador = {
      id: newId,
      nome,
      descricao: descricao || undefined,
      unidade: unidade || undefined,
      fonte: fonte || undefined,
      painelId,
      painel_id: painelId,
      valor: valor || undefined,
      tipo,
      variacao: variacao || undefined,
      ordem,
      data_criacao: nowIso,
      data_atualizacao: nowIso,
    };

    try {
      if (dbManager.isConnectedToMySQL) {
        // Grava na tabela 'indicador' (com os campos exatos: id, nome, descricao, unidade, fonte, painelId)
        try {
          await dbManager.query(
            `INSERT INTO indicador (id, nome, descricao, unidade, fonte, painelId, data_criacao, data_atualizacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              novoIndicador.id,
              novoIndicador.nome,
              novoIndicador.descricao || null,
              novoIndicador.unidade || null,
              novoIndicador.fonte || null,
              novoIndicador.painelId,
              formatMySQLDateTime(novoIndicador.data_criacao),
              formatMySQLDateTime(novoIndicador.data_atualizacao),
            ]
          );
        } catch (e: any) {
          console.warn('[Insert into indicador table]:', e.message);
        }

        // Grava também na tabela 'indicadores' para compatibilidade total
        try {
          await dbManager.query(
            `INSERT INTO indicadores (id, painel_id, painelId, nome, descricao, unidade, fonte, valor, tipo, variacao, ordem, data_criacao, data_atualizacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              novoIndicador.id,
              novoIndicador.painelId,
              novoIndicador.painelId,
              novoIndicador.nome,
              novoIndicador.descricao || null,
              novoIndicador.unidade || null,
              novoIndicador.fonte || null,
              novoIndicador.valor || null,
              novoIndicador.tipo || 'numero',
              novoIndicador.variacao || null,
              novoIndicador.ordem || 1,
              formatMySQLDateTime(novoIndicador.data_criacao),
              formatMySQLDateTime(novoIndicador.data_atualizacao),
            ]
          );
        } catch (e: any) {
          console.warn('[Insert into indicadores table]:', e.message);
        }
      }

      mockDb.indicadores.push(novoIndicador);

      return reply.status(201).send({
        message: 'Indicador criado com sucesso na tabela indicador!',
        tabela: 'indicador',
        indicador: {
          id: novoIndicador.id,
          nome: novoIndicador.nome,
          descricao: novoIndicador.descricao || null,
          unidade: novoIndicador.unidade || null,
          fonte: novoIndicador.fonte || null,
          painelId: novoIndicador.painelId,
          painel_id: novoIndicador.painelId,
          painel_nome: painelNome,
          valor: novoIndicador.valor || null,
          data_criacao: novoIndicador.data_criacao,
          data_atualizacao: novoIndicador.data_atualizacao,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao criar indicador no banco', details: err.message });
    }
  };

  fastify.post('/api/indicador', createIndicadorHandler);
  fastify.post('/api/indicadores', createIndicadorHandler);

  // Atualizar indicador
  const updateIndicadorHandler = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const body = (request.body || {}) as Partial<Indicador> & { painelId?: string; unit?: string; source?: string };
    const nowIso = new Date().toISOString();

    const targetPainelId = body.painelId || body.painel_id;

    try {
      // Se estiver alterando painelId, validar existência
      if (targetPainelId) {
        let pExists = false;
        if (dbManager.isConnectedToMySQL) {
          const check: any = await dbManager.query('SELECT id FROM paineis WHERE id = ?', [targetPainelId]);
          pExists = check && check.length > 0;
        } else {
          pExists = mockDb.paineis.some((pn) => pn.id === targetPainelId);
        }
        if (!pExists) {
          return reply.status(400).send({
            error: `O painel informado '${targetPainelId}' não existe na tabela 'paineis'. Chave estrangeira violada.`,
          });
        }
      }

      if (dbManager.isConnectedToMySQL) {
        const rows: any = await dbManager.query(
          'SELECT * FROM indicador WHERE id = ?',
          [id]
        );
        const current = (rows && rows[0]) || {};

        const updated = {
          nome: body.nome !== undefined ? body.nome.trim() : current.nome || '',
          descricao: body.descricao !== undefined ? body.descricao.trim() : current.descricao || null,
          unidade: body.unidade !== undefined ? body.unidade.trim() : body.unit !== undefined ? body.unit.trim() : current.unidade || null,
          fonte: body.fonte !== undefined ? body.fonte.trim() : body.source !== undefined ? body.source.trim() : current.fonte || null,
          painelId: targetPainelId || current.painelId || current.painel_id,
          valor: body.valor !== undefined ? String(body.valor).trim() : current.valor || null,
          tipo: body.tipo !== undefined ? body.tipo : current.tipo || 'numero',
          variacao: body.variacao !== undefined ? body.variacao : current.variacao || null,
          ordem: body.ordem !== undefined ? body.ordem : current.ordem || 0,
          data_atualizacao: formatMySQLDateTime(nowIso),
        };

        try {
          await dbManager.query(
            `UPDATE indicador SET nome = ?, descricao = ?, unidade = ?, fonte = ?, painelId = ?, data_atualizacao = ? WHERE id = ?`,
            [updated.nome, updated.descricao, updated.unidade, updated.fonte, updated.painelId, updated.data_atualizacao, id]
          );
        } catch (e) {
          // ignore
        }

        try {
          await dbManager.query(
            `UPDATE indicadores SET painel_id = ?, painelId = ?, nome = ?, descricao = ?, unidade = ?, fonte = ?, valor = ?, tipo = ?, variacao = ?, ordem = ?, data_atualizacao = ? WHERE id = ?`,
            [
              updated.painelId,
              updated.painelId,
              updated.nome,
              updated.descricao,
              updated.unidade,
              updated.fonte,
              updated.valor,
              updated.tipo,
              updated.variacao,
              updated.ordem,
              updated.data_atualizacao,
              id,
            ]
          );
        } catch (e) {
          // ignore
        }

        return reply.send({ message: 'Indicador atualizado com sucesso!', indicador: { id, ...updated, painel_id: updated.painelId } });
      }

      const idx = mockDb.indicadores.findIndex((i) => i.id === id);
      if (idx === -1) {
        return reply.status(404).send({ error: 'Indicador não encontrado.' });
      }

      mockDb.indicadores[idx] = {
        ...mockDb.indicadores[idx],
        ...body,
        painelId: targetPainelId || mockDb.indicadores[idx].painelId || mockDb.indicadores[idx].painel_id,
        painel_id: targetPainelId || mockDb.indicadores[idx].painel_id || mockDb.indicadores[idx].painelId,
        data_atualizacao: nowIso,
      };

      return reply.send({ message: 'Indicador atualizado com sucesso!', indicador: mockDb.indicadores[idx] });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao atualizar indicador', details: err.message });
    }
  };

  fastify.put('/api/indicador/:id', updateIndicadorHandler);
  fastify.put('/api/indicadores/:id', updateIndicadorHandler);

  // Excluir indicador
  const deleteIndicadorHandler = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };

    try {
      if (dbManager.isConnectedToMySQL) {
        try {
          await dbManager.query('DELETE FROM indicador WHERE id = ?', [id]);
        } catch (e) {}
        try {
          await dbManager.query('DELETE FROM indicadores WHERE id = ?', [id]);
        } catch (e) {}
      }

      mockDb.indicadores = mockDb.indicadores.filter((i) => i.id !== id);

      return reply.send({ success: true, message: `Indicador '${id}' excluído com sucesso da tabela indicador!` });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao excluir indicador', details: err.message });
    }
  };

  fastify.delete('/api/indicador/:id', deleteIndicadorHandler);
  fastify.delete('/api/indicadores/:id', deleteIndicadorHandler);
};
