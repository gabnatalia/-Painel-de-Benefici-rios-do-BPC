import React from 'react';
import { Users, DollarSign, HeartHandshake, AlertCircle, MapPin, Building2, CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';
import { BpcStats, DbStatus } from '../types';

interface DashboardViewProps {
  stats: BpcStats | null;
  dbStatus: DbStatus | null;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, dbStatus, onNavigateTab }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const total = stats?.total || 0;
  const totalAtivos = stats?.totalAtivos || 0;
  const totalIdosos = stats?.totalIdosos || 0;
  const totalPCD = stats?.totalPCD || 0;
  const totalEmRevisao = stats?.totalEmRevisao || 0;
  const valorInjetado = stats?.valorInjetadoMensal || 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context */}
      <div className="bg-gradient-to-r from-blue-900/50 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                Recife / PE
              </span>
              <span className="text-xs text-slate-400">
                Benefício de Prestação Continuada (LOAS)
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Monitoramento BPC do Recife & Controle de Acesso
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Sistema integrado da Prefeitura do Recife com backend Fastify e persistência MySQL para acompanhamento de idosos e PCDs em todas as 6 RPAs do município.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('beneficiarios')}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Consultar Beneficiários</span>
            </button>
            <button
              onClick={() => onNavigateTab('schema')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Schema MySQL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beneficiários */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-md hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Beneficiários Cadastrados</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{total}</div>
          <div className="mt-1 flex items-center text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>{totalAtivos} com benefício ativo</span>
          </div>
        </div>

        {/* Valor Mensal Injetado */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-md hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Injeção Mensal na Economia</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {formatCurrency(valorInjetado)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            R$ 1.412,00 por beneficiário ativo / mês
          </div>
        </div>

        {/* BPC Idosos vs PCD */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-md hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Público Atendido</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-purple-300">{totalIdosos}</span>
            <span className="text-xs text-slate-400">Idosos</span>
            <span className="text-slate-600">|</span>
            <span className="text-xl font-bold text-cyan-300">{totalPCD}</span>
            <span className="text-xs text-slate-400">PCDs</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {total > 0 ? Math.round((totalIdosos / total) * 100) : 0}% Idosos / {total > 0 ? Math.round((totalPCD / total) * 100) : 0}% PCDs
          </div>
        </div>

        {/* Em Revisão Cadastral */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-md hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Atenção Cadastral</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">{totalEmRevisao}</div>
          <div className="mt-1 text-xs text-amber-400/80">
            Revisão biométrica ou CadÚnico pendente
          </div>
        </div>
      </div>

      {/* Grid: RPA Recife Distribution & MySQL Entities Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RPAs of Recife Breakdown */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-base font-bold text-white">Distribuição por RPA do Recife</h3>
                <p className="text-xs text-slate-400">Regiões Político-Administrativas 1 a 6</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">6 Regiões</span>
          </div>

          <div className="space-y-3">
            {stats?.rpaStats?.map((rpa) => {
              const percentage = total > 0 ? Math.round((rpa.total / total) * 100) : 0;
              const rpaDescriptions: Record<number, string> = {
                1: 'Centro / Santo Amaro / Boa Vista / Recife Antigo',
                2: 'Zona Norte / Campo Grande / Encruzilhada / Arruda',
                3: 'Noroeste / Casa Amarela / Alto Santa Terezinha / Tamarineira',
                4: 'Oeste / Várzea / Caxangá / CDU / Iputinga',
                5: 'Sudoeste / Afogados / San Martin / Mustardinha / Areias',
                6: 'Sul / Boa Viagem / Pina / Ibura / Jordão',
              };

              return (
                <div key={rpa.rpa} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                        {rpa.nome}
                      </span>
                      <span className="text-slate-300 font-medium truncate max-w-[240px] sm:max-w-sm">
                        {rpaDescriptions[rpa.rpa]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">{rpa.total}</span>
                      <span className="text-slate-400 ml-1">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>Injeção: {formatCurrency(rpa.valorTotal)}/mês</span>
                    <span>Status: Operação Regular</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Backend & MySQL RBAC Overview */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Entidades MySQL & Fastify</h3>
                  <p className="text-xs text-slate-400">Estrutura relacional do backend</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'usuarios', count: dbStatus?.entityCounts?.usuarios || 0, desc: 'Usuários com login e hash bcrypt', tab: 'usuarios' },
                { name: 'papeis', count: dbStatus?.entityCounts?.papeis || 0, desc: 'Perfis de acesso e cargos', tab: 'papeis' },
                { name: 'permissoes', count: dbStatus?.entityCounts?.permissoes || 0, desc: 'Catálogo de ações autorizadas', tab: 'permissoes' },
                { name: 'usuario_papel', count: dbStatus?.entityCounts?.usuario_papel || 0, desc: 'Mapeamento N:N Usuário ↔ Papel', tab: 'rbac' },
                { name: 'papel_permissao', count: dbStatus?.entityCounts?.papel_permissao || 0, desc: 'Mapeamento N:N Papel ↔ Permissão', tab: 'rbac' },
                { name: 'beneficiarios_bpc', count: dbStatus?.entityCounts?.beneficiarios_bpc || 0, desc: 'Munícipes BPC de Recife', tab: 'beneficiarios' },
              ].map((entity) => (
                <div
                  key={entity.name}
                  onClick={() => onNavigateTab(entity.tab)}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                        {entity.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{entity.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                      {entity.count} registros
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Servidor: Node 22 + Fastify 5</span>
            <span className="text-emerald-400 font-medium">REST API Ativa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
