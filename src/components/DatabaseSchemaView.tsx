import React, { useState, useEffect } from 'react';
import { Database, Table, Copy, Check, Terminal, Play, RefreshCw, Layers, ShieldCheck, Server, AlertTriangle } from 'lucide-react';
import { DbStatus, DbSchemaResponse } from '../types';
import { api } from '../api';

interface DatabaseSchemaViewProps {
  dbStatus: DbStatus | null;
  onRefresh: () => void;
  onOpenDbModal: () => void;
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({
  dbStatus,
  onRefresh,
  onOpenDbModal,
}) => {
  const [schemaData, setSchemaData] = useState<DbSchemaResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTable, setActiveTable] = useState<string>('usuarios');
  const [reseeding, setReseeding] = useState(false);
  const [reseedMsg, setReseedMsg] = useState('');

  useEffect(() => {
    api.getDbSchema().then((data) => setSchemaData(data)).catch(console.error);
  }, []);

  const handleCopySQL = () => {
    if (schemaData?.sql) {
      navigator.clipboard.writeText(schemaData.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReseed = async () => {
    if (confirm('Deseja restaurar os dados de exemplo padrão para testes?')) {
      setReseeding(true);
      try {
        const res = await api.reseedDb();
        setReseedMsg(res.message || 'Dados restaurados com sucesso!');
        onRefresh();
        setTimeout(() => setReseedMsg(''), 4000);
      } catch (err) {
        console.error(err);
      } finally {
        setReseeding(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Schema Relacional MySQL & Servidor Fastify
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              DDL & Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Estrutura de dados das tabelas <span className="font-mono text-slate-300">usuarios</span>, <span className="font-mono text-slate-300">papeis</span>, <span className="font-mono text-slate-300">permissoes</span>, <span className="font-mono text-slate-300">usuario_papel</span>, <span className="font-mono text-slate-300">papel_permissao</span> e <span className="font-mono text-slate-300">beneficiarios_bpc</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDbModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Configurar Conexão MySQL</span>
          </button>

          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            <span>Restaurar Seed Padrão</span>
          </button>
        </div>
      </div>

      {reseedMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          {reseedMsg}
        </div>
      )}

      {/* Database Connection Status Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                dbStatus?.isConnectedToMySQL
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  {dbStatus?.isConnectedToMySQL ? 'MySQL Conectado Ativo' : 'Simulação Relacional em Memória (DDL Ativo)'}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                    dbStatus?.isConnectedToMySQL
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {dbStatus?.mode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Host: <strong className="text-slate-300">{dbStatus?.config.host || 'localhost'}</strong>:{dbStatus?.config.port || 3306} • Database: <strong className="text-slate-300">{dbStatus?.config.database || 'bpc_recife_db'}</strong>
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>Engine: <span className="font-mono text-blue-400 font-semibold">Fastify 5 + mysql2/promise</span></div>
            <div className="text-[11px] text-slate-500">Porta: 3000 (Vite Middleware Integrado)</div>
          </div>
        </div>

        {dbStatus?.lastError && !dbStatus.isConnectedToMySQL && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Status da Conexão:</strong> O backend está operando com persistência em memória compatível com o schema MySQL porque o servidor MySQL externo não foi detectado localmente. Todas as rotas CRUD e tabelas N:N funcionam normalmente. Para conectar a um banco MySQL remoto ou local, use o botão "Configurar Conexão MySQL".
            </div>
          </div>
        )}
      </div>

      {/* Tables Structure List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {schemaData?.tables.map((tbl) => (
          <div
            key={tbl.name}
            onClick={() => setActiveTable(tbl.name)}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              activeTable === tbl.name
                ? 'bg-slate-800 border-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-bold text-xs text-blue-400">
                {tbl.name}
              </span>
              <span className="text-[10px] text-slate-500">{tbl.colunas.length} colunas</span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{tbl.descricao}</p>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
              {tbl.colunas.slice(0, 3).map((col, idx) => (
                <span key={idx} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {col.split(' ')[0]}
                </span>
              ))}
              {tbl.colunas.length > 3 && (
                <span className="text-[10px] text-slate-500">+{tbl.colunas.length - 3}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SQL DDL Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              schema.sql • DDL das Entidades MySQL (MySQL 8.0+ / MariaDB)
            </span>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed selection:bg-blue-600 selection:text-white">
          {schemaData?.sql || '// Carregando schema DDL MySQL...'}
        </pre>
      </div>
    </div>
  );
};
