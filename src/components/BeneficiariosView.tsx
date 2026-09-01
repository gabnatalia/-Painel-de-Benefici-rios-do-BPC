import React, { useState } from 'react';
import { Search, Plus, Download, UserPlus, Filter, X, ShieldAlert } from 'lucide-react';
import { BeneficiarioBPC } from '../types';
import { api } from '../api';

interface BeneficiariosViewProps {
  beneficiarios: BeneficiarioBPC[];
  onRefresh: () => void;
}

export const BeneficiariosView: React.FC<BeneficiariosViewProps> = ({ beneficiarios, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedRpa, setSelectedRpa] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    nis: '',
    tipo_beneficio: 'Idoso (65+)' as BeneficiarioBPC['tipo_beneficio'],
    bairro_recife: 'Casa Amarela',
    rpa: 3,
    valor_beneficio: 1412.00,
    status: 'Ativo' as BeneficiarioBPC['status'],
    data_concessao: new Date().toISOString().split('T')[0],
    data_nascimento: '1955-05-15',
    cras_referencia: 'CRAS Alto Santa Terezinha',
    responsavel_legal: 'Titular',
  });

  const bairrosRecife = [
    { nome: 'Santo Amaro', rpa: 1, cras: 'CRAS Santo Amaro' },
    { nome: 'Boa Vista', rpa: 1, cras: 'CRAS Santo Amaro' },
    { nome: 'Campo Grande', rpa: 2, cras: 'CRAS Campina do Barreto' },
    { nome: 'Encruzilhada', rpa: 2, cras: 'CRAS Campina do Barreto' },
    { nome: 'Casa Amarela', rpa: 3, cras: 'CRAS Alto Santa Terezinha' },
    { nome: 'Vasco da Gama', rpa: 3, cras: 'CRAS Alto Santa Terezinha' },
    { nome: 'Várzea', rpa: 4, cras: 'CRAS Várzea / CDU' },
    { nome: 'Caxangá', rpa: 4, cras: 'CRAS Várzea / CDU' },
    { nome: 'Iputinga', rpa: 4, cras: 'CRAS Várzea / CDU' },
    { nome: 'Afogados', rpa: 5, cras: 'CRAS Afogados' },
    { nome: 'San Martin', rpa: 5, cras: 'CRAS San Martin / Mustardinha' },
    { nome: 'Mustardinha', rpa: 5, cras: 'CRAS San Martin / Mustardinha' },
    { nome: 'Boa Viagem', rpa: 6, cras: 'CRAS Pina / Brasília Teimosa' },
    { nome: 'Ibura', rpa: 6, cras: 'CRAS Ibura de Cima' },
    { nome: 'Pina', rpa: 6, cras: 'CRAS Pina / Brasília Teimosa' },
  ];

  // Filtering
  const filtered = beneficiarios.filter((item) => {
    const matchesSearch =
      !search ||
      item.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      item.cpf.includes(search) ||
      item.nis.includes(search) ||
      item.bairro_recife.toLowerCase().includes(search.toLowerCase());

    const matchesRpa = selectedRpa === 'all' || item.rpa === Number(selectedRpa);
    const matchesTipo = selectedTipo === 'all' || item.tipo_beneficio === selectedTipo;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesRpa && matchesTipo && matchesStatus;
  });

  const handleBairroChange = (bairroName: string) => {
    const found = bairrosRecife.find((b) => b.nome === bairroName);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        bairro_recife: found.nome,
        rpa: found.rpa,
        cras_referencia: found.cras,
      }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.createBeneficiario(formData);
      setIsModalOpen(false);
      onRefresh();
      // Reset
      setFormData({
        nome_completo: '',
        cpf: '',
        nis: '',
        tipo_beneficio: 'Idoso (65+)',
        bairro_recife: 'Casa Amarela',
        rpa: 3,
        valor_beneficio: 1412.00,
        status: 'Ativo',
        data_concessao: new Date().toISOString().split('T')[0],
        data_nascimento: '1955-05-15',
        cras_referencia: 'CRAS Alto Santa Terezinha',
        responsavel_legal: 'Titular',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: BeneficiarioBPC['status']) => {
    try {
      await api.updateBeneficiarioStatus(id, newStatus);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nome', 'CPF', 'NIS', 'Tipo', 'Bairro Recife', 'RPA', 'Valor (R$)', 'Status', 'CRAS'];
    const rows = filtered.map((b) => [
      b.id,
      `"${b.nome_completo}"`,
      b.cpf,
      b.nis,
      `"${b.tipo_beneficio}"`,
      `"${b.bairro_recife}"`,
      b.rpa,
      b.valor_beneficio,
      b.status,
      `"${b.cras_referencia}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bpc_recife_beneficiarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Beneficiários BPC da Cidade do Recife
          </h2>
          <p className="text-xs text-slate-400">
            Registro de munícipes amparados pela Lei Orgânica da Assistência Social (LOAS) nos CRAS municipais
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Beneficiário</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF, NIS ou bairro..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* RPA Filter */}
        <div className="flex items-center gap-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedRpa}
            onChange={(e) => setSelectedRpa(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as RPAs (1 a 6)</option>
            <option value="1">RPA 1 - Centro / Sto Amaro</option>
            <option value="2">RPA 2 - Zona Norte / Campo Grande</option>
            <option value="3">RPA 3 - Noroeste / Casa Amarela</option>
            <option value="4">RPA 4 - Oeste / Várzea</option>
            <option value="5">RPA 5 - Sudoeste / Afogados</option>
            <option value="6">RPA 6 - Sul / Boa Viagem / Ibura</option>
          </select>
        </div>

        {/* Tipo Filter */}
        <select
          value={selectedTipo}
          onChange={(e) => setSelectedTipo(e.target.value)}
          className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todos os Tipos</option>
          <option value="Idoso (65+)">Idoso (65+)</option>
          <option value="Pessoa com Deficiência (PCD)">PCD</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Em Revisão Cadastral">Em Revisão</option>
          <option value="Suspenso">Suspenso</option>
          <option value="Bloqueado Temporário">Bloqueado</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto">
          Exibindo <strong className="text-white">{filtered.length}</strong> de {beneficiarios.length}
        </span>
      </div>

      {/* Beneficiarios Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Beneficiário / CPF</th>
                <th className="px-4 py-3">Tipo & Valor</th>
                <th className="px-4 py-3">Bairro / RPA Recife</th>
                <th className="px-4 py-3">CRAS de Referência</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Alterar Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhum beneficiário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isIdoso = item.tipo_beneficio.includes('Idoso');
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{item.nome_completo}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>CPF: {item.cpf}</span>
                          <span>•</span>
                          <span>NIS: {item.nis}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            isIdoso
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                              : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                          }`}
                        >
                          {item.tipo_beneficio}
                        </span>
                        <div className="text-[11px] text-emerald-400 font-bold mt-1">
                          R$ {Number(item.valor_beneficio).toFixed(2)}/mês
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200">{item.bairro_recife}</div>
                        <div className="text-[11px] text-blue-400 font-medium">
                          RPA {item.rpa} (Recife)
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-300">{item.cras_referencia}</div>
                        <div className="text-[10px] text-slate-500">
                          Resp: {item.responsavel_legal || 'Titular'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.status === 'Ativo'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'Em Revisão Cadastral'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Em Revisão Cadastral">Em Revisão</option>
                          <option value="Suspenso">Suspenso</option>
                          <option value="Bloqueado Temporário">Bloqueado</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Beneficiário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Cadastrar Novo Beneficiário BPC</h3>
                <p className="text-xs text-slate-400">Prefeitura do Recife - Assistência Social</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo do Munícipe</label>
                <input
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  placeholder="Ex: Maria das Graças Pereira"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">NIS (CadÚnico)</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="11 dígitos"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Benefício BPC</label>
                  <select
                    value={formData.tipo_beneficio}
                    onChange={(e) => setFormData({ ...formData, tipo_beneficio: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Idoso (65+)">Idoso (65+ anos)</option>
                    <option value="Pessoa com Deficiência (PCD)">PCD (Qualquer Idade)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bairro do Recife</label>
                  <select
                    value={formData.bairro_recife}
                    onChange={(e) => handleBairroChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {bairrosRecife.map((b) => (
                      <option key={b.nome} value={b.nome}>
                        {b.nome} (RPA {b.rpa})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CRAS de Referência</label>
                  <input
                    type="text"
                    value={formData.cras_referencia}
                    onChange={(e) => setFormData({ ...formData, cras_referencia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Responsável Legal</label>
                  <input
                    type="text"
                    value={formData.responsavel_legal}
                    onChange={(e) => setFormData({ ...formData, responsavel_legal: e.target.value })}
                    placeholder="Titular ou nome do curador/tutor"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
                >
                  {submitting ? 'Cadastrando...' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
