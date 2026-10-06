import React from 'react';
import { Database, ShieldCheck, UserCheck, RefreshCw, Layers, Users, Key, Table, Activity, LogOut, KeyRound } from 'lucide-react';
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
    { id: 'dashboard', label: 'Painel BPC Recife', icon: Activity },
    { id: 'beneficiarios', label: 'Beneficiários', icon: Users },
    { id: 'usuarios', label: 'Usuários', icon: UserCheck, entity: 'usuarios' },
    { id: 'papeis', label: 'Papéis', icon: ShieldCheck, entity: 'papeis' },
    { id: 'permissoes', label: 'Permissões', icon: Key, entity: 'permissoes' },
    { id: 'rbac', label: 'Matriz de Acessos', icon: Layers, entity: 'N:N' },
    { id: 'schema', label: 'Schema MySQL & Fastify', icon: Table, badge: 'MySQL' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner with Recife identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-xl tracking-wider">
            REC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Painel de Beneficiário BPC do Recife
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SEMAS Recife
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Prefeitura do Recife • Gestão de Benefício de Prestação Continuada (LOAS) & Controle RBAC
            </p>
          </div>
        </div>

        {/* Status Indicators & Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* JWT Auth Indicator Pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
            title="Requisições autenticadas com JSON Web Token (Bearer)"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Sessão:</span>
            <span className="font-semibold">JWT Ativo</span>
          </div>

          {/* DB Status Badge */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              dbStatus?.isConnectedToMySQL
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Clique para configurar o banco de dados MySQL"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {dbStatus?.isConnectedToMySQL ? 'MySQL Conectado' : 'Modo Relacional (Schema Ativo)'}
            </span>
            <span className="md:hidden">
              {dbStatus?.isConnectedToMySQL ? 'MySQL' : 'Memória'}
            </span>
            <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* User Profile Pill & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                {currentUser.nome.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                  {currentUser.nome}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {currentUser.papeis?.[0]?.nome || 'Usuário'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer flex items-center gap-1 text-xs"
                title="Encerrar sessão JWT"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
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
              {tab.entity && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.entity}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
