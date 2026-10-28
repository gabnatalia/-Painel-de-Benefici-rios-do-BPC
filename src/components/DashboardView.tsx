import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Plus,
  Users,
  DollarSign,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ChevronRight,
  FileText,
  Search,
} from 'lucide-react';
import { BpcStats, DbStatus, Painel, Indicador } from '../types';
import { PaineisView } from './PaineisView';
import { api } from '../api';

interface DashboardViewProps {
  stats: BpcStats | null;
  dbStatus: DbStatus | null;
  paineis?: Painel[];
  onRefreshParent?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  dbStatus,
  paineis: initialPaineis,
  onRefreshParent,
  onNavigateTab,
}) => {
  const [activePainelTab, setActivePainelTab] = useState<string>('executivo');
  const [paineis, setPaineis] = useState<Painel[]>(initialPaineis || []);
  const [loadingPaineis, setLoadingPaineis] = useState<boolean>(false);

  // Carrega painéis do banco se não tiverem sido passados
  useEffect(() => {
    if (initialPaineis && initialPaineis.length > 0) {
      setPaineis(initialPaineis);
    } else {
      setLoadingPaineis(true);
      api.getPaineis()
        .then((data) => setPaineis(data))
        .catch(console.error)
        .finally(() => setLoadingPaineis(false));
    }
  }, [initialPaineis]);

  const refreshPaineis = async () => {
    try {
      const data = await api.getPaineis();
      setPaineis(data);
      if (onRefreshParent) onRefreshParent();
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const total = stats?.total || 0;
  const totalAtivos = stats?.totalAtivos || 0;
  const totalIdosos = stats?.totalIdosos || 0;
  const totalPCD = stats?.totalPCD || 0;
  const totalEmRevisao = stats?.totalEmRevisao || 0;
  const totalSuspensos = stats?.totalSuspensos || 0;
  const valorInjetado = stats?.valorInjetadoMensal || 0;

  // Encontra os painéis específicos pré-cadastrados
  const painelExecutivo = paineis.find((p) => p.id === 'painel-1');
  const painelTerritorial = paineis.find((p) => p.id === 'painel-2');
  const painelAuditoria = paineis.find((p) => p.id === 'painel-3');

  // Painéis personalizados adicionados pelo usuário
  const customPaineis = paineis.filter((p) => !['painel-1', 'painel-2', 'painel-3'].includes(p.id));

  // Encontra o painel customizado atual se selecionado
  const currentCustomPainel = customPaineis.find((p) => p.id === activePainelTab);

  return (
    <div className="space-y-6">
      {/* Topo: Identificação e Seletor de Painéis por Aba */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-400" />
              <span>Painéis de Gestão do BPC • Recife</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Secretaria de Desenvolvimento Social • Indicadores oficiais estruturados por abas temáticas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePainelTab('gerenciar')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Painel ou Indicador</span>
            </button>
            <button
              onClick={() => onNavigateTab('beneficiarios')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Lista de Beneficiários</span>
            </button>
          </div>
        </div>

        {/* Abas dos Painéis (Segmented Controls) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800/80 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActivePainelTab('executivo')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activePainelTab === 'executivo'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Painel Executivo Geral</span>
          </button>

          <button
            onClick={() => setActivePainelTab('territorial')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activePainelTab === 'territorial'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Territorial por RPA (1 a 6)</span>
          </button>

          <button
            onClick={() => setActivePainelTab('auditoria')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activePainelTab === 'auditoria'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoria & Conformidade</span>
          </button>

          {/* Abas de Painéis Criados pelo Usuário */}
          {customPaineis.map((cp) => (
            <button
              key={cp.id}
              onClick={() => setActivePainelTab(cp.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activePainelTab === cp.id
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{cp.nome}</span>
            </button>
          ))}

          <button
            onClick={() => setActivePainelTab('gerenciar')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ml-auto ${
              activePainelTab === 'gerenciar'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gerenciar Todos (FK)</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: PAINEL EXECUTIVO GERAL */}
      {/* ========================================================= */}
      {activePainelTab === 'executivo' && (
        <div className="space-y-6">
          {/* Descrição da Aba */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">
                {painelExecutivo?.nome || 'Painel Executivo BPC Recife'}
              </h2>
              <p className="text-xs text-slate-400">
                {painelExecutivo?.descricao || 'Visão consolidada de concessões, orçamento e cobertura social no município do Recife'}
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Atualizado em tempo real pelo banco de dados
            </div>
          </div>

          {/* KPIs Principais em Grid Limpo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Beneficiários Ativos</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {totalAtivos}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                De um total de {total} cadastrados
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Injeção Mensal no Recife</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {formatCurrency(valorInjetado)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                R$ 1.412,00 por titular ativo ao mês
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Idosos Atendidos (65+)</span>
                <HeartHandshake className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {totalIdosos}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {total > 0 ? Math.round((totalIdosos / total) * 100) : 0}% da cobertura do município
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Pessoas com Deficiência (PCD)</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {totalPCD}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {total > 0 ? Math.round((totalPCD / total) * 100) : 0}% com laudo pericial
              </p>
            </div>
          </div>

          {/* Indicadores Vinculados da Tabela 'indicadores' (Chave Estrangeira painel-1) */}
          {painelExecutivo?.indicadores && painelExecutivo.indicadores.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Métricas Oficiais do Painel Executivo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registros na tabela <span className="font-mono text-slate-300">indicadores</span> com FK <span className="font-mono text-blue-300">painel_id = 'painel-1'</span>
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {painelExecutivo.indicadores.length} indicadores cadastrados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {painelExecutivo.indicadores.map((ind) => (
                  <div
                    key={ind.id}
                    className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs text-slate-400 font-medium block">
                        {ind.nome}
                      </span>
                      <div className="text-xl font-bold text-white mt-1.5 tracking-tight">
                        {ind.valor}
                      </div>
                      {ind.descricao && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {ind.descricao}
                        </p>
                      )}
                    </div>
                    {ind.variacao && (
                      <div className="mt-3 pt-2 border-t border-slate-800/60 text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{ind.variacao}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proporção e Perfil Social */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">
              Composição do Público Beneficiário no Recife
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Idosos em Extrema Vulnerabilidade</div>
                  <div className="text-lg font-bold text-purple-300 mt-0.5">{totalIdosos} cidadãos</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Critério: 65 anos ou mais e renda per capita até 1/4 SM</p>
                </div>
                <div className="text-2xl font-black text-purple-400">
                  {total > 0 ? Math.round((totalIdosos / total) * 100) : 0}%
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Pessoas com Deficiência (PCD)</div>
                  <div className="text-lg font-bold text-cyan-300 mt-0.5">{totalPCD} cidadãos</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Critério: Impedimento de longo prazo e vulnerabilidade social</p>
                </div>
                <div className="text-2xl font-black text-cyan-400">
                  {total > 0 ? Math.round((totalPCD / total) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: PAINEL TERRITORIAL POR RPA (1 A 6) */}
      {/* ========================================================= */}
      {activePainelTab === 'territorial' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">
                {painelTerritorial?.nome || 'Monitoramento Territorial por RPA'}
              </h2>
              <p className="text-xs text-slate-400">
                {painelTerritorial?.descricao || 'Indicadores geográficos e demanda por Região Político-Administrativa do Recife (RPAs 1 a 6)'}
              </p>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              6 Regiões Político-Administrativas
            </div>
          </div>

          {/* Indicadores Vinculados da Tabela 'indicadores' (Chave Estrangeira painel-2) */}
          {painelTerritorial?.indicadores && painelTerritorial.indicadores.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {painelTerritorial.indicadores.map((ind) => (
                <div
                  key={ind.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm"
                >
                  <span className="text-xs text-slate-400 font-medium block">{ind.nome}</span>
                  <div className="text-xl font-bold text-white mt-1">{ind.valor}</div>
                  {ind.descricao && (
                    <p className="text-xs text-slate-400 mt-1">{ind.descricao}</p>
                  )}
                  {ind.variacao && (
                    <div className="mt-2 text-xs text-blue-400 font-medium">{ind.variacao}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Gráfico Detalhado das 6 RPAs do Recife */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Cobertura do BPC por RPA no Recife
              </h3>
              <p className="text-xs text-slate-400">
                Total de titulares e recursos federais injetados mensalmente em cada território
              </p>
            </div>

            <div className="space-y-3">
              {stats?.rpaStats?.map((rpa) => {
                const percentage = total > 0 ? Math.round((rpa.total / total) * 100) : 0;
                const rpaDescriptions: Record<number, string> = {
                  1: 'Centro • Santo Amaro, Boa Vista, Recife Antigo, Soledade, Coelhos',
                  2: 'Zona Norte • Campo Grande, Encruzilhada, Arruda, Campina do Barreto',
                  3: 'Noroeste • Casa Amarela, Alto Santa Terezinha, Vasco da Gama, Tamarineira',
                  4: 'Oeste • Várzea, Caxangá, CDU, Iputinga, Torrões, Cordeiro',
                  5: 'Sudoeste • Afogados, San Martin, Mustardinha, Areias, Barro, Bongi',
                  6: 'Sul • Boa Viagem, Pina, Brasília Teimosa, Ibura, Jordão, Imbiribeira',
                };

                return (
                  <div key={rpa.rpa} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-400">
                          {rpa.nome}
                        </span>
                        <span className="text-slate-400 hidden sm:inline">
                          — {rpaDescriptions[rpa.rpa]}
                        </span>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="font-bold text-white">{rpa.total} beneficiários</span>
                        <span className="text-slate-400 ml-1.5">({percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Injeção: {formatCurrency(rpa.valorTotal)} ao mês</span>
                      <span className="text-slate-400">Atendimento regular nos CRAS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: PAINEL DE AUDITORIA & CONFORMIDADE */}
      {/* ========================================================= */}
      {activePainelTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">
                {painelAuditoria?.nome || 'Auditoria e Conformidade Cadastral'}
              </h2>
              <p className="text-xs text-slate-400">
                {painelAuditoria?.descricao || 'Acompanhamento de revisões do CadÚnico, bloqueios preventivos e conformidade LOAS'}
              </p>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Controle de Conformidade SEMAS
            </div>
          </div>

          {/* Cards de Status de Benefício */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Benefícios Ativos & Regulares</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{totalAtivos}</div>
              <p className="text-xs text-slate-400 mt-1">
                Sem pendências cadastrais identificadas
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Em Revisão Cadastral</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300">{totalEmRevisao}</div>
              <p className="text-xs text-slate-400 mt-1">
                Aguardando comparecimento ao CRAS de referência
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Bloqueados / Suspensos</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-400">{totalSuspensos}</div>
              <p className="text-xs text-slate-400 mt-1">
                Irregularidade documental ou óbito em verificação
              </p>
            </div>
          </div>

          {/* Indicadores Vinculados da Tabela 'indicadores' (Chave Estrangeira painel-3) */}
          {painelAuditoria?.indicadores && painelAuditoria.indicadores.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white mb-3">
                Indicadores de Integridade Social
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {painelAuditoria.indicadores.map((ind) => (
                  <div key={ind.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">{ind.nome}</span>
                    <div className="text-xl font-bold text-white mt-1.5">{ind.valor}</div>
                    {ind.descricao && (
                      <p className="text-xs text-slate-400 mt-1">{ind.descricao}</p>
                    )}
                    {ind.variacao && (
                      <div className="mt-2 text-xs text-emerald-400 font-medium">{ind.variacao}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações Recomendadas de Auditoria */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">
              Orientações para os Técnicos dos CRAS do Recife
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                <strong>Atualização CadÚnico</strong>: Beneficiários sem atualização nos últimos 24 meses devem ser convocados pela equipe técnica do CRAS.
              </li>
              <li>
                <strong>Comprovação de Residência</strong>: Garantir que o munícipe reside na RPA correspondente ao CRAS atendido.
              </li>
              <li>
                <strong>Perícia PCD</strong>: Acompanhar prazos de reavaliação pericial do INSS para evitar bloqueios automáticos do benefício.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA CUSTOMIZADA: PAINEL ADICIONADO PELO USUÁRIO */}
      {/* ========================================================= */}
      {currentCustomPainel && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">{currentCustomPainel.nome}</h2>
              {currentCustomPainel.descricao && (
                <p className="text-xs text-slate-400">{currentCustomPainel.descricao}</p>
              )}
            </div>
            <div className="text-xs font-mono text-slate-400">
              id: {currentCustomPainel.id}
            </div>
          </div>

          {currentCustomPainel.indicadores && currentCustomPainel.indicadores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentCustomPainel.indicadores.map((ind) => (
                <div key={ind.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                  <span className="text-xs text-slate-400 font-medium block">{ind.nome}</span>
                  <div className="text-xl font-bold text-white mt-1.5">{ind.valor}</div>
                  {ind.descricao && (
                    <p className="text-xs text-slate-400 mt-1">{ind.descricao}</p>
                  )}
                  {ind.variacao && (
                    <div className="mt-2 text-xs text-emerald-400 font-medium">{ind.variacao}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              Este painel ainda não possui indicadores vinculados. Acesse a aba "Gerenciar Todos" para adicionar métricas com a chave estrangeira.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 4: GERENCIAR TODOS OS PAINÉIS & INDICADORES (FK) */}
      {/* ========================================================= */}
      {activePainelTab === 'gerenciar' && (
        <div className="space-y-4">
          <PaineisView onRefreshParent={refreshPaineis} />
        </div>
      )}
    </div>
  );
};
