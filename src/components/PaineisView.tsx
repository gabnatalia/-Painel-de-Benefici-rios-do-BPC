import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  Link2,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Painel, Indicador } from '../types';
import { api } from '../api';

interface PaineisViewProps {
  onRefreshParent?: () => void;
}

export const PaineisView: React.FC<PaineisViewProps> = ({ onRefreshParent }) => {
  const [paineis, setPaineis] = useState<Painel[]>([]);
  const [selectedPainelId, setSelectedPainelId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state for Novo Painel
  const [showPainelModal, setShowPainelModal] = useState(false);
  const [novoPainelNome, setNovoPainelNome] = useState('');
  const [novoPainelDesc, setNovoPainelDesc] = useState('');
  const [novoPainelIcone, setNovoPainelIcone] = useState('LayoutDashboard');

  // Modal / Form state for Novo Indicador
  const [showIndicadorModal, setShowIndicadorModal] = useState(false);
  const [novoIndPainelId, setNovoIndPainelId] = useState('');
  const [novoIndNome, setNovoIndNome] = useState('');
  const [novoIndValor, setNovoIndValor] = useState('');
  const [novoIndTipo, setNovoIndTipo] = useState('numero');
  const [novoIndDesc, setNovoIndDesc] = useState('');
  const [novoIndVariacao, setNovoIndVariacao] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getPaineis();
      setPaineis(data);
      if (data.length > 0 && !novoIndPainelId) {
        setNovoIndPainelId(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao carregar painéis' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePainel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPainelNome.trim()) return;

    try {
      await api.createPainel({
        nome: novoPainelNome.trim(),
        descricao: novoPainelDesc.trim(),
        icone: novoPainelIcone,
        ativo: 1,
        ordem: paineis.length + 1,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Painel "${novoPainelNome}" cadastrado com sucesso na tabela 'paineis'!`,
      });
      setShowPainelModal(false);
      setNovoPainelNome('');
      setNovoPainelDesc('');
      loadData();
      if (onRefreshParent) onRefreshParent();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao cadastrar painel' });
    }
  };

  const handleCreateIndicador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoIndPainelId || !novoIndNome.trim() || !novoIndValor.trim()) return;

    try {
      await api.createIndicador({
        painel_id: novoIndPainelId,
        nome: novoIndNome.trim(),
        valor: novoIndValor.trim(),
        tipo: novoIndTipo,
        descricao: novoIndDesc.trim() || undefined,
        variacao: novoIndVariacao.trim() || undefined,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Indicador "${novoIndNome}" vinculado com chave estrangeira ao painel com sucesso!`,
      });
      setShowIndicadorModal(false);
      setNovoIndNome('');
      setNovoIndValor('');
      setNovoIndDesc('');
      setNovoIndVariacao('');
      loadData();
      if (onRefreshParent) onRefreshParent();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao cadastrar indicador' });
    }
  };

  const handleDeletePainel = async (id: string, nome: string) => {
    if (confirm(`Excluir o painel "${nome}"?\n\nATENÇÃO: Devido à Chave Estrangeira (ON DELETE CASCADE), todos os indicadores vinculados a este painel serão excluídos automaticamente!`)) {
      try {
        await api.deletePainel(id);
        setFeedbackMsg({
          type: 'success',
          text: `Painel "${nome}" e seus indicadores foram excluídos (CASCADE)!`,
        });
        loadData();
        if (onRefreshParent) onRefreshParent();
        setTimeout(() => setFeedbackMsg(null), 4000);
      } catch (err: any) {
        setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao excluir painel' });
      }
    }
  };

  const handleDeleteIndicador = async (id: string, nome: string) => {
    if (confirm(`Deseja remover o indicador "${nome}"?`)) {
      try {
        await api.deleteIndicador(id);
        setFeedbackMsg({
          type: 'success',
          text: `Indicador "${nome}" removido com sucesso!`,
        });
        loadData();
        if (onRefreshParent) onRefreshParent();
        setTimeout(() => setFeedbackMsg(null), 4000);
      } catch (err: any) {
        setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao remover indicador' });
      }
    }
  };

  const filteredPaineis = selectedPainelId === 'all'
    ? paineis
    : paineis.filter((p) => p.id === selectedPainelId);

  const totalIndicadoresGerais = paineis.reduce((acc, p) => acc + (p.indicadores?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-400" />
              Tabelas: Painéis & Indicadores
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              FK 1:N CASCADE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Relação relacional entre as tabelas <span className="font-mono text-blue-300">paineis</span> e <span className="font-mono text-emerald-300">indicadores</span> (<span className="font-mono text-slate-300">indicadores.painel_id → paineis.id</span>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPainelModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Painel</span>
          </button>

          <button
            onClick={() => {
              if (paineis.length > 0 && !novoIndPainelId) setNovoIndPainelId(paineis[0].id);
              setShowIndicadorModal(true);
            }}
            disabled={paineis.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Indicador (FK)</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Foreign Key Relation Architecture Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-700/60 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Chave Estrangeira Configurada</span>
                <span className="font-mono text-emerald-400 lowercase text-[11px] font-normal">
                  fk_indicadores_painel
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                indicadores (painel_id) ➔ REFERENCES paineis (id) ON DELETE CASCADE ON UPDATE CASCADE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              Total Painéis: <span className="font-bold text-white">{paineis.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">
              Total Indicadores: <span className="font-bold">{totalIndicadoresGerais}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedPainelId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
            selectedPainelId === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Todos os Painéis ({paineis.length})
        </button>
        {paineis.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPainelId(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedPainelId === p.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{p.nome}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {p.indicadores?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Content: Panels with their Indicators */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Carregando painéis e métricas...</div>
      ) : filteredPaineis.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
          Nenhum painel cadastrado no momento.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPaineis.map((painel) => {
            const inds = painel.indicadores || [];
            return (
              <div
                key={painel.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl overflow-hidden"
              >
                {/* Panel Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mt-0.5">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">{painel.nome}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          id: {painel.id}
                        </span>
                        {painel.ativo ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                            Inativo
                          </span>
                        )}
                      </div>
                      {painel.descricao && (
                        <p className="text-xs text-slate-400 mt-0.5">{painel.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        setNovoIndPainelId(painel.id);
                        setShowIndicadorModal(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                      title="Adicionar novo indicador a este painel"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Métrica</span>
                    </button>

                    <button
                      onClick={() => handleDeletePainel(painel.id, painel.nome)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition cursor-pointer"
                      title="Excluir este painel e cascatear para todos os indicadores"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Indicators Grid */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      Indicadores Vinculados ({inds.length})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      WHERE painel_id = '{painel.id}'
                    </span>
                  </div>

                  {inds.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400">
                      Nenhum indicador vinculado a este painel ainda. Clique em "Adicionar Métrica" acima.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {inds.map((ind) => (
                        <div
                          key={ind.id}
                          className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition relative group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-medium text-slate-400 line-clamp-1" title={ind.nome}>
                                {ind.nome}
                              </span>
                              <button
                                onClick={() => handleDeleteIndicador(ind.id, ind.nome)}
                                className="opacity-0 group-hover:opacity-100 transition text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                title="Excluir indicador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="mt-2 text-xl font-black text-white tracking-tight">
                              {ind.valor}
                            </div>

                            {ind.descricao && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                {ind.descricao}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                            {ind.variacao ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-medium font-mono">
                                <TrendingUp className="w-3 h-3" />
                                {ind.variacao}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono">tipo: {ind.tipo}</span>
                            )}
                            <span className="font-mono text-slate-500 text-[9px]">{ind.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Novo Painel */}
      {showPainelModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Cadastrar Novo Painel</h3>
            <p className="text-xs text-slate-400 mb-4">
              Cria um registro na tabela <span className="font-mono text-blue-400">paineis</span>.
            </p>

            <form onSubmit={handleCreatePainel} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Painel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gestão de Benefícios BPC 2026"
                  value={novoPainelNome}
                  onChange={(e) => setNovoPainelNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Descrição das métricas consolidadas neste painel"
                  value={novoPainelDesc}
                  onChange={(e) => setNovoPainelDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ícone
                </label>
                <select
                  value={novoPainelIcone}
                  onChange={(e) => setNovoPainelIcone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="LayoutDashboard">LayoutDashboard (Padrão)</option>
                  <option value="Activity">Activity (Métricas)</option>
                  <option value="MapPin">MapPin (Territorial/RPA)</option>
                  <option value="ShieldCheck">ShieldCheck (Auditoria)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPainelModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  Criar Painel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Indicador (Chave Estrangeira) */}
      {showIndicadorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Cadastrar Indicador (Métrica)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Cria um registro na tabela <span className="font-mono text-emerald-400">indicadores</span> com a Chave Estrangeira <span className="font-mono text-blue-400">painel_id</span>.
            </p>

            <form onSubmit={handleCreateIndicador} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Painel Associado (Foreign Key: painel_id) *
                </label>
                <select
                  required
                  value={novoIndPainelId}
                  onChange={(e) => setNovoIndPainelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-blue-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  {paineis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (id: {p.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  CONSTRAINT fk_indicadores_painel FOREIGN KEY (painel_id) REFERENCES paineis (id)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome da Métrica *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Novos Beneficiários no Mês"
                    value={novoIndNome}
                    onChange={(e) => setNovoIndNome(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 142 ou R$ 200.504,00"
                    value={novoIndValor}
                    onChange={(e) => setNovoIndValor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipo de Dado
                  </label>
                  <select
                    value={novoIndTipo}
                    onChange={(e) => setNovoIndTipo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="numero">Número Inteiro / Decimal</option>
                    <option value="moeda">Moeda (R$)</option>
                    <option value="percentual">Percentual (%)</option>
                    <option value="texto">Texto Informativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Variação / Comparativo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: +5.2% vs mês anterior"
                    value={novoIndVariacao}
                    onChange={(e) => setNovoIndVariacao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição Detalhada
                </label>
                <textarea
                  rows={2}
                  placeholder="Explicação do cálculo ou origem dos dados"
                  value={novoIndDesc}
                  onChange={(e) => setNovoIndDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIndicadorModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition cursor-pointer"
                >
                  Criar Indicador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
