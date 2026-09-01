import React, { useState } from 'react';
import { ShieldCheck, Plus, Edit3, Trash2, Key, Users, Check, X, ShieldAlert } from 'lucide-react';
import { Papel, Permissao } from '../types';
import { api } from '../api';

interface PapeisViewProps {
  papeis: Papel[];
  permissoes: Permissao[];
  onRefresh: () => void;
}

export const PapeisView: React.FC<PapeisViewProps> = ({ papeis, permissoes, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPapel, setEditingPapel] = useState<Papel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    permissoes_ids: [] as string[],
  });

  const openCreateModal = () => {
    setEditingPapel(null);
    setFormData({
      nome: '',
      descricao: '',
      permissoes_ids: ['perm-1'],
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (papel: Papel) => {
    setEditingPapel(papel);
    const assignedPermIds = papel.permissoes?.map((p) => p.id) || (papel.permissoes_ids || []);
    setFormData({
      nome: papel.nome,
      descricao: papel.descricao,
      permissoes_ids: assignedPermIds,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissoes_ids.includes(permId);
      if (exists) {
        return { ...prev, permissoes_ids: prev.permissoes_ids.filter((id) => id !== permId) };
      } else {
        return { ...prev, permissoes_ids: [...prev.permissoes_ids, permId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingPapel) {
        await api.updatePapel(editingPapel.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          permissoes_ids: formData.permissoes_ids,
        });
      } else {
        await api.createPapel({
          nome: formData.nome,
          descricao: formData.descricao,
          permissoes_ids: formData.permissoes_ids,
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar papel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este papel? Todas as permissões vinculadas em papel_permissao serão desassociadas.')) {
      try {
        await api.deletePapel(id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Gestão da Entidade <span className="font-mono text-purple-400">papeis</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
              MySQL Table
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Perfis de acesso, responsabilidades da equipe municipal e amarração na tabela <span className="font-mono text-slate-300">papel_permissao</span>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Papel</span>
        </button>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {papeis.map((papel) => {
          const rolePerms = papel.permissoes || [];

          return (
            <div
              key={papel.id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-600 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{papel.nome}</h3>
                      <span className="text-[10px] font-mono text-slate-500">ID: {papel.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(papel)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      title="Editar Papel"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(papel.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-slate-700 transition"
                      title="Excluir Papel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {papel.descricao || 'Sem descrição cadastrada.'}
                </p>

                {/* Permissions Assigned */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>Permissões Concedidas ({rolePerms.length})</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {rolePerms.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">Nenhuma permissão vinculada</span>
                    ) : (
                      rolePerms.map((perm) => (
                        <span
                          key={perm.id}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{perm.nome}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>{papel.total_usuarios || 0} usuários associados</span>
                </div>
                <span>Criado: {new Date(papel.data_criacao).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Papel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingPapel ? 'Editar Papel' : 'Criar Novo Papel'}
                </h3>
                <p className="text-xs text-slate-400">Tabela MySQL: <span className="font-mono text-purple-400">papeis</span> & <span className="font-mono text-amber-400">papel_permissao</span></p>
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
                <label className="block text-slate-300 font-semibold mb-1">Nome do Papel</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Supervisor de CRAS"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição das Atribuições</label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Responsável por validar cadastros e emitir relatórios da sua respectiva RPA..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Vincular Permissões (<span className="font-mono text-amber-400">papel_permissao</span>)
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                  {permissoes.map((perm) => {
                    const isSelected = formData.permissoes_ids.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-purple-600/20 border border-purple-500/40 text-white' : 'hover:bg-slate-700/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded bg-slate-900 border-slate-700 text-purple-500"
                          />
                          <div>
                            <span className="font-mono font-medium text-xs text-purple-300">{perm.nome}</span>
                            <p className="text-[10px] text-slate-400">{perm.descricao}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition shadow-lg shadow-purple-600/30"
                >
                  {submitting ? 'Salvando...' : editingPapel ? 'Salvar Alterações' : 'Criar Papel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
