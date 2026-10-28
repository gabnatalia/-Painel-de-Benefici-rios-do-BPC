import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail ou usuário de acesso.');
      return;
    }
    if (!senha) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.login(email.trim(), senha);
      onLoginSuccess(result);
    } catch (err: any) {
      // Mensagem clara e explícita para o usuário
      const msg = err.message || '';
      if (msg.includes('Usuário não encontrado') || msg.includes('não encontrado')) {
        setErrorMessage('Usuário não encontrado. Verifique o e-mail digitado e tente novamente.');
      } else if (msg.includes('Senha incorreta') || msg.includes('senha')) {
        setErrorMessage('Senha incorreta. Verifique a senha digitada e tente novamente.');
      } else if (msg.includes('bloqueado') || msg.includes('inativo')) {
        setErrorMessage('Acesso bloqueado: Este usuário está inativo no cadastro do município.');
      } else {
        setErrorMessage('Usuário ou senha incorretos. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brasão / Identidade Recife */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-md tracking-wider">
            REC
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Prefeitura do Recife
            </h1>
            <p className="text-xs text-slate-400">
              Secretaria de Desenvolvimento Social • Painel do Beneficiário BPC
            </p>
          </div>
        </div>

        {/* Card de Login Padrão e Limpo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-white">Acesse sua conta</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Informe seu e-mail institucional e senha para entrar no sistema.
            </p>
          </div>

          {/* Mensagem de Erro Clara quando errar login ou senha */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 transition-all"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block text-rose-200">Falha no acesso</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                E-mail ou Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="usuario@recife.pe.gov.br"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-senha"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Entrando no sistema...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé institucional discreto */}
        <p className="text-center text-xs text-slate-500">
          Prefeitura da Cidade do Recife • Secretaria de Desenvolvimento Social
        </p>
      </div>
    </div>
  );
};
