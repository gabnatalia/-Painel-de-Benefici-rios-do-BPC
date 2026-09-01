import React, { useState } from 'react';
import { UserCheck, UserX, UserPlus, Search, Edit3, Trash2, Shield, Mail, Key, CheckCircle, XCircle, X } from 'lucide-react';
import { Usuario, Papel } from '../types';
import { api } from '../api';

interface UsuariosViewProps {
  usuarios: Usuario[];
  papeis: Papel[];
  onRefresh: () => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({ usuarios, papeis, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    ativo: true,
    papeis_ids: [] as string[],
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      ativo: true,
      papeis_ids: papeis.length > 0 ? [papeis[0].id] : [],
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    const assignedPapelIds = user.papeis?.map((p) => p.id) || (user.papeis_ids ? user.papeis_ids.split(',') : []);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      ativo: Boolean(user.ativo),
      papeis_ids: assignedPapelIds,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: Usuario) => {
    try {
      const nextStatus = !user.ativo;
      await api.toggleUsuarioStatus(user.id, nextStatus);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário? Todos os vínculos em usuario_papel serão removidos.')) {
      try {
        await api.deleteUsuario(id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingUser) {
        await api.updateUsuario(editingUser.id, {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha || undefined,
          ativo: formData.ativo,
          papeis_ids: formData.papeis_ids,
        });
      } else {
        await api.createUsuario({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha || 'recife123',
          ativo: formData.ativo,
          papeis_ids: formData.papeis_ids,
        });
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRoleSelection = (papelId: string) => {
    setFormData((prev) => {
      const exists = prev.papeis_ids.includes(papelId);
      if (exists) {
        return { ...prev, papeis_ids: prev.papeis_ids.filter((id) => id !== papelId) };
      } else {
        return { ...prev, papeis_ids: [...prev.papeis_ids, papelId] };
      }
    });
  };

  const filtered = usuarios.filter((u) => {
    const q = search.toLowerCase();
    return u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Gestão da Entidade <span className="font-mono text-blue-400">usuarios</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              MySQL Table
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Controle de contas, senhas com hash bcrypt, status ativo/inativo e associação à tabela <span className="font-mono text-slate-300">usuario_papel</span>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Usuário</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Total: <strong className="text-white">{filtered.length}</strong> usuários cadastrados
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">ID & Nome</th>
                <th className="px-4 py-3">E-mail Institucional</th>
                <th className="px-4 py-3">Papéis Atribuídos (usuario_papel)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data Criação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((user) => {
                const isUserActive = Boolean(user.ativo);
                const userRolesList = user.papeis || [];

                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{user.nome}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {user.id}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {userRolesList.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic">Sem papel atribuído</span>
                        ) : (
                          userRolesList.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            >
                              {r.nome}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                          isUserActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Clique para alternar o status"
                      >
                        {isUserActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(user.data_criacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          title="Editar Usuário"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 border border-slate-700 hover:border-rose-700 transition"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
                </h3>
                <p className="text-xs text-slate-400">Tabela MySQL: <span className="font-mono text-blue-400">usuarios</span></p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@recife.pe.gov.br"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Padrão: recife123'}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Papéis de Acesso (<span className="font-mono text-blue-400">usuario_papel</span>)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                  {papeis.map((papel) => {
                    const isSelected = formData.papeis_ids.includes(papel.id);
                    return (
                      <div
                        key={papel.id}
                        onClick={() => toggleRoleSelection(papel.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'hover:bg-slate-700/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded bg-slate-900 border-slate-700 text-blue-500"
                          />
                          <span className="font-medium text-xs">{papel.nome}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{papel.descricao?.slice(0, 30)}...</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-500"
                />
                <label htmlFor="ativoCheckbox" className="text-slate-300 font-medium cursor-pointer">
                  Usuário Ativo no Sistema
                </label>
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
                  {submitting ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
