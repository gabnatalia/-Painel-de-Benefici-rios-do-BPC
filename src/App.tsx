import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { BeneficiariosView } from './components/BeneficiariosView';
import { UsuariosView } from './components/UsuariosView';
import { PapeisView } from './components/PapeisView';
import { PermissoesView } from './components/PermissoesView';
import { MatrizRbacView } from './components/MatrizRbacView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { DbConnectionModal } from './components/DbConnectionModal';
import {
  Usuario,
  Papel,
  Permissao,
  UsuarioPapel,
  PapelPermissao,
  BeneficiarioBPC,
  BpcStats,
  DbStatus,
  AuthResponse,
} from './types';
import { api } from './api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => api.isAuthenticated());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);

  // Core Data States
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [bpcStats, setBpcStats] = useState<BpcStats | null>(null);
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioBPC[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [usuarioPapel, setUsuarioPapel] = useState<UsuarioPapel[]>([]);
  const [papelPermissao, setPapelPermissao] = useState<PapelPermissao[]>([]);

  const loadAllData = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const [
        statusRes,
        userRes,
        statsRes,
        beneficiariosRes,
        usuariosRes,
        papeisRes,
        permissoesRes,
        upRes,
        ppRes,
      ] = await Promise.all([
        api.getDbStatus().catch(() => null),
        api.getMe().catch(() => null),
        api.getBeneficiariosStats().catch(() => null),
        api.getBeneficiarios().catch(() => ({ total: 0, items: [] })),
        api.getUsuarios().catch(() => []),
        api.getPapeis().catch(() => []),
        api.getPermissoes().catch(() => []),
        api.getUsuarioPapel().catch(() => []),
        api.getPapelPermissao().catch(() => []),
      ]);

      if (statusRes) setDbStatus(statusRes);
      if (userRes?.usuario) setCurrentUser(userRes.usuario);
      if (statsRes) setBpcStats(statsRes);
      if (beneficiariosRes?.items) setBeneficiarios(beneficiariosRes.items);
      if (Array.isArray(usuariosRes)) setUsuarios(usuariosRes);
      if (Array.isArray(papeisRes)) setPapeis(papeisRes);
      if (Array.isArray(permissoesRes)) setPermissoes(permissoesRes);
      if (Array.isArray(upRes)) setUsuarioPapel(upRes);
      if (Array.isArray(ppRes)) setPapelPermissao(ppRes);
    } catch (err) {
      console.error('Error fetching app data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
    };

    const handleAuthLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
    };

    window.addEventListener('bpc:auth_expired', handleAuthExpired);
    window.addEventListener('bpc:auth_logout', handleAuthLogout);

    if (api.isAuthenticated()) {
      setIsAuthenticated(true);
      loadAllData();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }

    return () => {
      window.removeEventListener('bpc:auth_expired', handleAuthExpired);
      window.removeEventListener('bpc:auth_logout', handleAuthLogout);
    };
  }, [loadAllData]);

  const handleLoginSuccess = (authData: AuthResponse) => {
    setCurrentUser(authData.usuario);
    setIsAuthenticated(true);
    setLoading(true);
    loadAllData();
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Se não autenticado via JWT, renderiza a tela de login
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        currentUser={currentUser}
        onRefresh={loadAllData}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Autenticando requisições com JWT & Carregando Painel BPC...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={bpcStats}
                dbStatus={dbStatus}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'beneficiarios' && (
              <BeneficiariosView
                beneficiarios={beneficiarios}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'usuarios' && (
              <UsuariosView
                usuarios={usuarios}
                papeis={papeis}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'papeis' && (
              <PapeisView
                papeis={papeis}
                permissoes={permissoes}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'permissoes' && (
              <PermissoesView
                permissoes={permissoes}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'rbac' && (
              <MatrizRbacView
                usuarios={usuarios}
                papeis={papeis}
                permissoes={permissoes}
                usuarioPapel={usuarioPapel}
                papelPermissao={papelPermissao}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'schema' && (
              <DatabaseSchemaView
                dbStatus={dbStatus}
                onRefresh={loadAllData}
                onOpenDbModal={() => setIsDbModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Painel de Beneficiário BPC do Recife • Secretaria de Desenvolvimento Social
          </div>
          <div className="flex items-center gap-3">
            <span>Fastify + Node</span>
            <span>•</span>
            <span className="text-indigo-400 font-medium">JWT HS256 Auth</span>
            <span>•</span>
            <span>MySQL Relational Engine</span>
            <span>•</span>
            <span>React + Tailwind</span>
          </div>
        </div>
      </footer>

      {/* Database Connection Modal */}
      <DbConnectionModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        dbStatus={dbStatus}
        onSuccess={() => {
          setIsDbModalOpen(false);
          loadAllData();
        }}
      />
    </div>
  );
}
