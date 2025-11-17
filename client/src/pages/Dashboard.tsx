import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import Footer from '../components/Footer';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    carregarKPIs();
  }, []);

  const carregarKPIs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/kpis', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKpis(data);
      }
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <DashboardHeader userName={user?.name || 'Usuário'} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                Transações Pendentes
              </h3>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-blue-400 mb-1">
              {loading ? '...' : (kpis?.transacoesPendentes || 0)}
            </p>
            <p className="text-sm text-slate-400">Aguardando classificação</p>
          </div>

          <div className="card bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border-emerald-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                Taxa de Automação
              </h3>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-emerald-400 mb-1">
              {loading ? '...' : `${kpis?.taxaAutomacao || 0}%`}
            </p>
            <p className="text-sm text-slate-400">Classificações automáticas</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                Empresas Ativas
              </h3>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-purple-400 mb-1">
              {loading ? '...' : (kpis?.empresasAtivas || 0)}
            </p>
            <p className="text-sm text-slate-400">Cadastradas no sistema</p>
          </div>
        </div>

        {/* KPIs Adicionais */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                  Total Entradas
                </h3>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-400 mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalEntradas || 0)}
              </p>
            </div>

            <div className="card bg-gradient-to-br from-red-600/20 to-red-700/20 border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                  Total Saídas
                </h3>
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-red-400 mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalSaidas || 0)}
              </p>
            </div>

            <div className={`card ${(kpis.saldo || 0) >= 0 ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border-emerald-500/30' : 'bg-gradient-to-br from-red-600/20 to-red-700/20 border-red-500/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                  Saldo
                </h3>
                <div className={`p-2 ${(kpis.saldo || 0) >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg`}>
                  <svg className={`w-5 h-5 ${(kpis.saldo || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${(kpis.saldo || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.saldo || 0)}
              </p>
            </div>

            <div className="card bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                  Ticket Médio
                </h3>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-400 mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.ticketMedio || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Distribuição por Categoria */}
        {kpis && kpis.distribuicaoCategorias && kpis.distribuicaoCategorias.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Top 10 Categorias
            </h3>
            <div className="space-y-3">
              {kpis.distribuicaoCategorias.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.tipo === 'entrada' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-slate-300 font-medium">{item.categoria}</span>
                  </div>
                  <span className={`text-lg font-bold ${item.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Card */}
        <div className="card bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/50 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              Bem-vindo ao FinSync!
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Comece cadastrando suas empresas e contas bancárias.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <button 
                onClick={() => navigate('/empresas')}
                className="group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Cadastrar Empresa
              </button>
              <button 
                onClick={() => navigate('/contas')}
                className="group relative px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Contas Bancárias
              </button>
              <button 
                onClick={() => navigate('/importacao')}
                className="group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/50 hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Importar Extrato
              </button>
              <button 
                onClick={() => navigate('/transacoes')}
                className="group relative px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ver Transações
              </button>
              <button 
                onClick={() => navigate('/relatorios')}
                className="group relative px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/50 hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Relatórios
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
