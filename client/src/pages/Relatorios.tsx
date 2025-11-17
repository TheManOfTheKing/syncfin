import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import Header from '../components/Header';

export default function Relatorios() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/empresas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const gerarRelatorio = async (tipo: 'dre-fluxo' | 'exportacao-detalhada' | 'divergencias') => {
    if (!empresaId) {
      alert('Selecione uma empresa');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        empresaId,
        formato: 'xlsx',
      });
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

      const response = await fetch(`/api/relatorios/${tipo}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${tipo}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header title="Relatórios" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded"></div>
            Filtros do Relatório
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Empresa *
              </label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Selecione uma empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Relatório DRE/Fluxo */}
          <div className="card bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">DRE/Fluxo</h3>
                <p className="text-sm text-slate-400">Resumo por categoria</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Relatório consolidado com soma de entradas e saídas por categoria contábil, excluindo transferências internas.
            </p>
            <button
              onClick={() => gerarRelatorio('dre-fluxo')}
              disabled={loading || !empresaId}
              className="btn-primary w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {loading ? 'Gerando...' : 'Exportar XLSX'}
            </button>
          </div>

          {/* Exportação Detalhada */}
          <div className="card bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border-emerald-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Exportação Detalhada</h3>
                <p className="text-sm text-slate-400">Todas as transações</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Planilha completa com todas as transações, incluindo descrição, categoria, status e valores.
            </p>
            <button
              onClick={() => gerarRelatorio('exportacao-detalhada')}
              disabled={loading || !empresaId}
              className="btn-primary w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            >
              {loading ? 'Gerando...' : 'Exportar XLSX'}
            </button>
          </div>

          {/* Relatório de Divergências */}
          <div className="card bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-yellow-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Divergências</h3>
                <p className="text-sm text-slate-400">Transações pendentes</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Lista de transações não classificadas automaticamente ou com baixa confiança, que precisam de revisão manual.
            </p>
            <button
              onClick={() => gerarRelatorio('divergencias')}
              disabled={loading || !empresaId}
              className="btn-primary w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
            >
              {loading ? 'Gerando...' : 'Exportar XLSX'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

