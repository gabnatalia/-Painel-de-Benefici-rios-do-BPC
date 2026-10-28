import React from 'react';
import { Database, ShieldCheck, UserCheck, RefreshCw, Layers, Users, Key, Table, Activity, LogOut, KeyRound, LayoutDashboard } from 'lucide-react';
import { DbStatus, Usuario } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbStatus: DbStatus | null;
  currentUser: Usuario | null;
  onRefresh: () => void;
  onOpenDbModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dbStatus,
  currentUser,
  onRefresh,
  onOpenDbModal,
  onLogout,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painéis do BPC', icon: LayoutDashboard },
    { id: 'beneficiarios', label: 'Beneficiários', icon: Users },
    { id: 'usuarios', label: 'Usuários', icon: UserCheck },
    { id: 'papeis', label: 'Papéis', icon: ShieldCheck },
    { id: 'permissoes', label: 'Permissões', icon: Key },
    { id: 'rbac', label: 'Matriz RBAC', icon: Layers },
    { id: 'schema', label: 'Banco MySQL', icon: Database },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner with Recife identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">
            REC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                Painel do Beneficiário BPC • Recife
              </h1>
              <span className="text-xs text-slate-400">· SEMAS</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gestão de Benefício de Prestação Continuada (LOAS) & Controle RBAC
            </p>
          </div>
        </div>

        {/* Status Indicators & Action */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* DB Status Button */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              dbStatus?.isConnectedToMySQL
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Clique para configurar a conexão com o MySQL"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {dbStatus?.isConnectedToMySQL ? 'MySQL Conectado' : 'MySQL / Local'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus?.isConnectedToMySQL ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Atualizar dados do sistema"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                  {currentUser.nome}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {currentUser.papeis?.[0]?.nome || 'Usuário'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer flex items-center gap-1 text-xs"
                title="Sair do sistema"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 scrollbar-none py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
