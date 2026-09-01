import React, { useState } from 'react';
import { Key, Plus, Trash2, Shield, Search, X, Check, ShieldAlert } from 'lucide-react';
import { Permissao } from '../types';
import { api } from '../api';

interface PermissoesViewProps {
  permissoes: Permissao[];
  onRefresh: () => void;
}

export const PermissoesView: React.FC<PermissoesViewProps> = ({ permissoes, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.createPermissao(formData);
      setIsModalOpen(false);
      setFormData({ nome: '', descricao: '' });
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar permissão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta permissão? Todas as associações em papel_permissao serão removidas.')) {
      try {
        await api.deletePermissao(id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filtered = permissoes.filter((p) => {
    const q = search.toLowerCase();
    return p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Catálogo da Entidade <span className="font-mono text-amber-400">permissoes</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              MySQL Table
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Ações atômicas e autorizações do sistema BPC Recife (ex: <span className="font-mono text-slate-300">bpc:visualizar</span>, <span className="font-mono text-slate-300">usuarios:gerenciar</span>).
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-600/30 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Permissão</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por identificador ou descrição..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Total: <strong className="text-white">{filtered.length}</strong> permissões cadastradas
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Identificador da Permissão (nome)</th>
                <th className="px-4 py-3">Descrição da Ação</th>
                <th className="px-4 py-3">Papéis que Possuem (papel_permissao)</th>
                <th className="px-4 py-3">Data de Criação</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((perm) => {
                const rolesList = perm.papeis_associados || [];

                return (
                  <tr key={perm.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {perm.nome}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {perm.id}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {perm.descricao}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {rolesList.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">Nenhum papel</span>
                        ) : (
                          rolesList.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
                            >
                              {r.nome}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(perm.data_criacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(perm.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-slate-700 transition"
                        title="Excluir Permissão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Permissão */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Nova Permissão do Sistema</h3>
                <p className="text-xs text-slate-400">Tabela MySQL: <span className="font-mono text-amber-400">permissoes</span></p>
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

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Identificador da Permissão (nome)</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: bpc:auditar ou relatorios:emitir"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição</label>
                <textarea
                  rows={3}
                  required
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Permite ao usuário gerar auditorias de benefícios concedidos..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
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
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-500 transition shadow-lg shadow-amber-600/30"
                >
                  {submitting ? 'Salvando...' : 'Cadastrar Permissão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
