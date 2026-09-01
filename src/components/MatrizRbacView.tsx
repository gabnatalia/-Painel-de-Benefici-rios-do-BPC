import React, { useState } from 'react';
import { Layers, Check, X, Shield, Key, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { Usuario, Papel, Permissao, UsuarioPapel, PapelPermissao } from '../types';
import { api } from '../api';

interface MatrizRbacViewProps {
  usuarios: Usuario[];
  papeis: Papel[];
  permissoes: Permissao[];
  usuarioPapel: UsuarioPapel[];
  papelPermissao: PapelPermissao[];
  onRefresh: () => void;
}

export const MatrizRbacView: React.FC<MatrizRbacViewProps> = ({
  usuarios,
  papeis,
  permissoes,
  usuarioPapel,
  papelPermissao,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'papel_permissao' | 'usuario_papel'>('papel_permissao');
  const [loadingAction, setLoadingAction] = useState(false);

  // Toggle papel_permissao
  const handleTogglePapelPermissao = async (papelId: string, permissaoId: string, hasPerm: boolean) => {
    setLoadingAction(true);
    try {
      if (hasPerm) {
        await api.removePapelPermissao(papelId, permissaoId);
      } else {
        await api.assignPapelPermissao(papelId, permissaoId);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle usuario_papel
  const handleToggleUsuarioPapel = async (usuarioId: string, papelId: string, hasRole: boolean) => {
    setLoadingAction(true);
    try {
      if (hasRole) {
        await api.removeUsuarioPapel(usuarioId, papelId);
      } else {
        await api.assignUsuarioPapel(usuarioId, papelId);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Matriz de Acessos & Tabelas Associativas N:N
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
              RBAC Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Gerenciamento direto dos vínculos em <span className="font-mono text-amber-300">papel_permissao</span> e <span className="font-mono text-blue-300">usuario_papel</span> com atualização em tempo real no banco de dados.
          </p>
        </div>

        {/* Subtabs switcher */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('papel_permissao')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'papel_permissao'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            papel_permissao (Papéis × Permissões)
          </button>
          <button
            onClick={() => setActiveSubTab('usuario_papel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'usuario_papel'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            usuario_papel (Usuários × Papéis)
          </button>
        </div>
      </div>

      {/* Matriz 1: Papel × Permissão */}
      {activeSubTab === 'papel_permissao' && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/60 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Tabela <span className="font-mono text-purple-400">papel_permissao</span> (Mapeamento de Direitos)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Clique nos círculos para conceder ou revogar permissões instantaneamente
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 min-w-[240px]">Permissão do Sistema</th>
                  {papeis.map((p) => (
                    <th key={p.id} className="px-4 py-3 text-center min-w-[130px]">
                      <div className="text-white font-bold">{p.nome}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{p.id}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {permissoes.map((perm) => (
                  <tr key={perm.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-amber-300">{perm.nome}</div>
                      <div className="text-[11px] text-slate-400">{perm.descricao}</div>
                    </td>
                    {papeis.map((papel) => {
                      const hasPerm = papelPermissao.some(
                        (pp) => pp.papel_id === papel.id && pp.permissao_id === perm.id
                      );

                      return (
                        <td key={papel.id} className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleTogglePapelPermissao(papel.id, perm.id, hasPerm)}
                            disabled={loadingAction}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                              hasPerm
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40'
                                : 'bg-slate-900/60 text-slate-600 border border-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40'
                            }`}
                            title={hasPerm ? 'Clique para revogar permissão' : 'Clique para conceder permissão'}
                          >
                            {hasPerm ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matriz 2: Usuário × Papel */}
      {activeSubTab === 'usuario_papel' && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/60 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                Tabela <span className="font-mono text-blue-400">usuario_papel</span> (Atribuição de Perfis)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Clique nos círculos para atribuir ou desvincular papéis aos usuários
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 min-w-[240px]">Usuário Cadastrado</th>
                  {papeis.map((p) => (
                    <th key={p.id} className="px-4 py-3 text-center min-w-[130px]">
                      <div className="text-white font-bold">{p.nome}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{p.id}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{user.nome}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </td>
                    {papeis.map((papel) => {
                      const hasRole = usuarioPapel.some(
                        (up) => up.usuario_id === user.id && up.papel_id === papel.id
                      );

                      return (
                        <td key={papel.id} className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleUsuarioPapel(user.id, papel.id, hasRole)}
                            disabled={loadingAction}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                              hasRole
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40'
                                : 'bg-slate-900/60 text-slate-600 border border-slate-800 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/40'
                            }`}
                            title={hasRole ? 'Clique para remover papel do usuário' : 'Clique para atribuir papel ao usuário'}
                          >
                            {hasRole ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
