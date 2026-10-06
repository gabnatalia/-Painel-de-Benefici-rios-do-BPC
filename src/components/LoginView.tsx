import React, { useState } from 'react';
import { Lock, Mail, Shield, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, Sparkles, UserCheck } from 'lucide-react';
import { api } from '../api';
import { AuthResponse } from '../types';

interface LoginViewProps {
  onLoginSuccess: (authData: AuthResponse) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin.bpc@recife.pe.gov.br');
  const [senha, setSenha] = useState<string>('recife123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoAccounts = [
    {
      nome: 'Maria Clara Vasconcelos',
      cargo: 'Administradora Geral',
      email: 'admin.bpc@recife.pe.gov.br',
      papel: 'Administrador Geral (Total + RBAC)',
      cor: 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:border-blue-400',
    },
    {
      nome: 'Dr. Roberto Freire Silva',
      cargo: 'Gestor SEMAS Recife',
      email: 'gestor.semas@recife.pe.gov.br',
      papel: 'Gestor SEMAS (Indicadores & Relatórios)',
      cor: 'border-purple-500/40 bg-purple-500/10 text-purple-400 hover:border-purple-400',
    },
    {
      nome: 'Aline Barbosa de Andrade',
      cargo: 'Assistente Social',
      email: 'aline.cras.varzea@recife.pe.gov.br',
      papel: 'Assistente Social CRAS Várzea (Cadastro & Edição)',
      cor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400',
    },
    {
      nome: 'Carlos Eduardo Maranhão',
      cargo: 'Técnico Operacional',
      email: 'carlos.cras.ibura@recife.pe.gov.br',
      papel: 'Assistente Social CRAS Ibura',
      cor: 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:border-amber-400',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await api.login(email, senha);
      onLoginSuccess(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar no servidor Fastify.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setSenha('recife123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-blue-600 text-white shadow-xl shadow-blue-500/20 font-black text-2xl tracking-wider mb-2">
            REC
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Painel de Beneficiário BPC do Recife
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Prefeitura do Recife • SEMAS • Autenticação centralizada com JSON Web Token (JWT) e RBAC
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Login do Operador</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
              JWT HS256
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <span className="font-semibold block">Erro de Autenticação</span>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                E-mail Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@recife.pe.gov.br"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span>Senha padrão para contas de teste:</span>
                <code className="text-amber-400 font-mono bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
                  recife123
                </code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando via Fastify...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar com JWT</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Login Accounts */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso Rápido para Teste de Perfis (RBAC):</span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectQuickAccount(acc.email)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between group ${acc.cor}`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-slate-200 group-hover:text-white">
                      {acc.nome}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {acc.papel}
                    </div>
                  </div>
                  <UserCheck className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Segurança JWT Ativada no Frontend & Backend:</span>
          </div>
          <p>
            • Ao fazer login, o Fastify emite um token assinado com a chave <code className="text-slate-300 font-mono">JWT_SECRET</code>.
          </p>
          <p>
            • Todas as requisições subsequentes do React enviam o cabeçalho <code className="text-slate-300 font-mono">Authorization: Bearer &lt;token&gt;</code>.
          </p>
          <p>
            • Acesso aos dados de beneficiários, papéis e permissões é restrito e validado a cada chamada.
          </p>
        </div>
      </div>
    </div>
  );
};
