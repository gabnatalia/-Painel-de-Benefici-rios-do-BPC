import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { dbManager, mockDb, BeneficiarioBPC, formatMySQLDateTime, formatMySQLDate } from '../db.js';

export const beneficiariosRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List BPC beneficiaries with search and filters
  fastify.get('/api/beneficiarios', async (request, reply) => {
    try {
      const { search, bairro, rpa, tipo, status } = request.query as {
        search?: string;
        bairro?: string;
        rpa?: string;
        tipo?: string;
        status?: string;
      };

      let list = [...mockDb.beneficiarios];

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (b) =>
            b.nome_completo.toLowerCase().includes(q) ||
            b.cpf.includes(q) ||
            b.nis.includes(q) ||
            b.cras_referencia.toLowerCase().includes(q)
        );
      }

      if (bairro) {
        list = list.filter((b) => b.bairro_recife.toLowerCase() === bairro.toLowerCase());
      }

      if (rpa) {
        list = list.filter((b) => b.rpa === Number(rpa));
      }

      if (tipo) {
        list = list.filter((b) => b.tipo_beneficio === tipo);
      }

      if (status) {
        list = list.filter((b) => b.status === status);
      }

      return reply.send({
        total: list.length,
        items: list,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar beneficiários', details: err.message });
    }
  });

  // Analytics and statistics by Recife RPA and status
  fastify.get('/api/beneficiarios/stats', async (request, reply) => {
    try {
      const total = mockDb.beneficiarios.length;
      const totalAtivos = mockDb.beneficiarios.filter((b) => b.status === 'Ativo').length;
      const totalIdosos = mockDb.beneficiarios.filter((b) => b.tipo_beneficio === 'Idoso (65+)').length;
      const totalPCD = mockDb.beneficiarios.filter((b) => b.tipo_beneficio === 'Pessoa com Deficiência (PCD)').length;
      const totalEmRevisao = mockDb.beneficiarios.filter((b) => b.status === 'Em Revisão Cadastral').length;
      const totalSuspensos = mockDb.beneficiarios.filter((b) => b.status === 'Suspenso').length;
      const valorInjetadoMensal = mockDb.beneficiarios
        .filter((b) => b.status === 'Ativo')
        .reduce((acc, curr) => acc + (Number(curr.valor_beneficio) || 1412), 0);

      // Distribution by RPA (Recife has RPAs 1 to 6)
      const rpaStats = [1, 2, 3, 4, 5, 6].map((rpaNum) => {
        const count = mockDb.beneficiarios.filter((b) => b.rpa === rpaNum).length;
        const totalVal = mockDb.beneficiarios
          .filter((b) => b.rpa === rpaNum && b.status === 'Ativo')
          .reduce((acc, curr) => acc + (Number(curr.valor_beneficio) || 1412), 0);
        return {
          rpa: rpaNum,
          nome: `RPA ${rpaNum}`,
          total: count,
          valorTotal: totalVal,
        };
      });

      // Distribution by Bairro
      const bairrosCount: Record<string, number> = {};
      mockDb.beneficiarios.forEach((b) => {
        bairrosCount[b.bairro_recife] = (bairrosCount[b.bairro_recife] || 0) + 1;
      });

      return reply.send({
        total,
        totalAtivos,
        totalIdosos,
        totalPCD,
        totalEmRevisao,
        totalSuspensos,
        valorInjetadoMensal,
        rpaStats,
        bairrosCount,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao calcular estatísticas BPC', details: err.message });
    }
  });

  // Create beneficiary
  fastify.post('/api/beneficiarios', async (request, reply) => {
    const body = request.body as Partial<BeneficiarioBPC>;

    if (!body.nome_completo || !body.cpf || !body.nis || !body.bairro_recife) {
      return reply.status(400).send({ error: 'Nome, CPF, NIS e Bairro de Recife são obrigatórios.' });
    }

    const exists = mockDb.beneficiarios.some((b) => b.cpf === body.cpf || b.nis === body.nis);
    if (exists) {
      return reply.status(400).send({ error: 'Beneficiário com este CPF ou NIS já cadastrado.' });
    }

    const now = new Date().toISOString();
    const newBpc: BeneficiarioBPC = {
      id: `bpc-${Date.now()}`,
      nome_completo: body.nome_completo,
      cpf: body.cpf,
      nis: body.nis,
      tipo_beneficio: body.tipo_beneficio || 'Idoso (65+)',
      bairro_recife: body.bairro_recife,
      rpa: Number(body.rpa) || 1,
      valor_beneficio: Number(body.valor_beneficio) || 1412.00,
      status: body.status || 'Ativo',
      data_concessao: body.data_concessao || new Date().toISOString().split('T')[0],
      data_nascimento: body.data_nascimento || '1960-01-01',
      cras_referencia: body.cras_referencia || 'CRAS Recife',
      responsavel_legal: body.responsavel_legal || 'Titular',
      data_atualizacao: now,
    };

    mockDb.beneficiarios.unshift(newBpc);

    if (dbManager.isConnectedToMySQL) {
      try {
        const mysqlCreated = formatMySQLDateTime(newBpc.data_atualizacao);
        const mysqlDataConcessao = formatMySQLDate(newBpc.data_concessao);
        const mysqlDataNascimento = formatMySQLDate(newBpc.data_nascimento);

        await dbManager.query(
          `INSERT INTO beneficiarios_bpc (id, nome_completo, cpf, nis, tipo_beneficio, bairro_recife, rpa, valor_beneficio, status, data_concessao, data_nascimento, cras_referencia, responsavel_legal, data_atualizacao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newBpc.id,
            newBpc.nome_completo,
            newBpc.cpf,
            newBpc.nis,
            newBpc.tipo_beneficio,
            newBpc.bairro_recife,
            newBpc.rpa,
            newBpc.valor_beneficio,
            newBpc.status,
            mysqlDataConcessao,
            mysqlDataNascimento,
            newBpc.cras_referencia,
            newBpc.responsavel_legal,
            mysqlCreated,
          ]
        );
      } catch (err) {
        console.warn('MySQL insert beneficiarios_bpc error:', err);
      }
    }

    return reply.status(201).send({ message: 'Beneficiário cadastrado com sucesso!', beneficiario: newBpc });
  });

  // Update beneficiary status
  fastify.patch('/api/beneficiarios/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: BeneficiarioBPC['status'] };

    const item = mockDb.beneficiarios.find((b) => b.id === id);
    if (!item) return reply.status(404).send({ error: 'Beneficiário não encontrado' });

    item.status = status;
    item.data_atualizacao = new Date().toISOString();

    if (dbManager.isConnectedToMySQL) {
      const mysqlUpdated = formatMySQLDateTime(item.data_atualizacao);
      await dbManager.query(`UPDATE beneficiarios_bpc SET status = ?, data_atualizacao = ? WHERE id = ?`, [
        item.status,
        mysqlUpdated,
        id,
      ]);
    }

    return reply.send({ message: 'Status atualizado com sucesso!', beneficiario: item });
  });

  // Delete beneficiary
  fastify.delete('/api/beneficiarios/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    mockDb.beneficiarios = mockDb.beneficiarios.filter((b) => b.id !== id);

    if (dbManager.isConnectedToMySQL) {
      await dbManager.query(`DELETE FROM beneficiarios_bpc WHERE id = ?`, [id]);
    }

    return reply.send({ message: 'Beneficiário excluído com sucesso!' });
  });
};
