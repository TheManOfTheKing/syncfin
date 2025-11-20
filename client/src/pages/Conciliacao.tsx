import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildApiUrl } from '../config/api';
import Header from '../components/Header';

export default function Conciliacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const abaInicial = (searchParams.get('aba') as 'importar' | 'executar' | 'resultados' | 'lancamentos') || 'importar';
  const [abaAtiva, setAbaAtiva] = useState<'importar' | 'executar' | 'resultados' | 'lancamentos'>(abaInicial);
  const [empresaId, setEmpresaId] = useState('');
  const [contaId, setContaId] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [resultadoImportacao, setResultadoImportacao] = useState<any>(null);
  
  // Estados para execução de conciliação
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [resultadoConciliacao, setResultadoConciliacao] = useState<any>(null);
  const [lotes, setLotes] = useState<any[]>([]);
  
  // Estados para detalhes do lote
  const [loteDetalhes, setLoteDetalhes] = useState<any>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<number | null>(null);
  const [menuExportAberto, setMenuExportAberto] = useState<number | null>(null);
  
  // Estados para lançamentos
  const [lancamentos, setLancamentos] = useState<any[]>([]);

  useEffect(() => {
    carregarEmpresas();
    carregarLotes();
    if (abaAtiva === 'lancamentos') {
      carregarLancamentos();
    }
  }, [abaAtiva]);

  // Fechar menu de exportação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuExportAberto !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setMenuExportAberto(null);
        }
      }
    };

    if (menuExportAberto !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuExportAberto]);

  const carregarEmpresas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/empresas'), {
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

  const carregarContas = async (empId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/contas/empresa/${empId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setContas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const carregarLotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/conciliacao/lotes'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLotes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  const carregarLancamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/conciliacao/lancamentos'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLancamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    }
  };

  const carregarDetalhesLote = async (loteId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/conciliacao/lotes/${loteId}/detalhes`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLoteDetalhes(data);
        setLoteSelecionado(loteId);
        setMostrarDetalhes(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do lote:', error);
      alert('Erro ao carregar detalhes do lote');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const handleImportarLancamentos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo || !empresaId) {
      alert('Selecione um arquivo e uma empresa');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('empresaId', empresaId);
      if (contaId) formData.append('contaId', contaId);

      const response = await fetch(buildApiUrl('/api/conciliacao/lancamentos/importar'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResultadoImportacao(data);
        alert(`Importação realizada com sucesso! ${data.totalImportado} lançamentos importados.`);
        setArquivo(null);
        setEmpresaId('');
        setContaId('');
        if (abaAtiva === 'lancamentos') {
          carregarLancamentos();
        }
      } else {
        const error = await response.json();
        alert(`Erro ao importar: ${error.erro || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao importar lançamentos:', error);
      alert('Erro ao importar lançamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleExecutarConciliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId || !dataInicio || !dataFim) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : null;
      
      const response = await fetch(buildApiUrl('/api/conciliacao/executar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          empresaId: parseInt(empresaId),
          contaId: contaId ? parseInt(contaId) : undefined,
          dataInicio,
          dataFim,
          usuarioId: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResultadoConciliacao(data);
        alert('Conciliação executada com sucesso!');
        carregarLotes();
        setAbaAtiva('resultados');
      } else {
        const error = await response.json();
        alert(`Erro ao executar conciliação: ${error.erro || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao executar conciliação:', error);
      alert('Erro ao executar conciliação');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovarConciliacao = async (conciliacaoId: number) => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : null;
      
      const response = await fetch(buildApiUrl(`/api/conciliacao/aprovar/${conciliacaoId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ usuarioId: userId }),
      });

      if (response.ok) {
        alert('Conciliação aprovada com sucesso!');
        if (loteSelecionado) {
          carregarDetalhesLote(loteSelecionado);
        }
      } else {
        alert('Erro ao aprovar conciliação');
      }
    } catch (error) {
      console.error('Erro ao aprovar conciliação:', error);
      alert('Erro ao aprovar conciliação');
    }
  };

  const handleRejeitarConciliacao = async (conciliacaoId: number) => {
    const motivo = prompt('Informe o motivo da rejeição:');
    if (!motivo) return;

    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : null;
      
      const response = await fetch(buildApiUrl(`/api/conciliacao/rejeitar/${conciliacaoId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ usuarioId: userId, motivo }),
      });

      if (response.ok) {
        alert('Conciliação rejeitada com sucesso!');
        if (loteSelecionado) {
          carregarDetalhesLote(loteSelecionado);
        }
      } else {
        alert('Erro ao rejeitar conciliação');
      }
    } catch (error) {
      console.error('Erro ao rejeitar conciliação:', error);
      alert('Erro ao rejeitar conciliação');
    }
  };

  const handleExportar = async (loteId: number, formato: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/conciliacao/exportar/${loteId}?formato=${formato}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conciliacao_lote_${loteId}.${formato === 'json' ? 'json' : formato === 'csv' ? 'csv' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Arquivo exportado com sucesso!');
      } else {
        alert('Erro ao exportar arquivo');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar arquivo');
    }
  };

  const matchesAutomaticos = loteDetalhes?.conciliacoes?.filter((c: any) => c.status === 'aprovada' && c.tipo === 'automatica') || [];
  const matchesSugeridos = loteDetalhes?.conciliacoes?.filter((c: any) => c.status === 'pendente' && c.tipo === 'sugerida') || [];
  const divergencias = loteDetalhes?.divergencias || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header 
        title="Conciliação Bancária" 
        actions={
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setAbaAtiva('importar')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                abaAtiva === 'importar'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Importar Lançamentos
            </button>
            <button
              onClick={() => setAbaAtiva('lancamentos')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                abaAtiva === 'lancamentos'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lançamentos Importados
            </button>
            <button
              onClick={() => setAbaAtiva('executar')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                abaAtiva === 'executar'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Executar Conciliação
            </button>
            <button
              onClick={() => setAbaAtiva('resultados')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                abaAtiva === 'resultados'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resultados
            </button>
          </div>
        </div>

        {/* Aba: Importar Lançamentos */}
        {abaAtiva === 'importar' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded"></div>
              Importar Lançamentos Contábeis
            </h2>
            <p className="text-slate-400 mb-6">
              Importe arquivos CNAB 240, CNAB 400 ou CSV com contas a pagar e receber do seu ERP.
            </p>

            <form onSubmit={handleImportarLancamentos} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Empresa *
                </label>
                <select
                  value={empresaId}
                  onChange={(e) => {
                    setEmpresaId(e.target.value);
                    if (e.target.value) {
                      carregarContas(e.target.value);
                    } else {
                      setContas([]);
                    }
                  }}
                  className="input-field"
                  required
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conta Bancária (opcional)
                </label>
                <select
                  value={contaId}
                  onChange={(e) => setContaId(e.target.value)}
                  className="input-field"
                  disabled={!empresaId}
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Arquivo (CNAB 240, CNAB 400 ou CSV) *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-400">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300">
                        <span>Selecione um arquivo</span>
                        <input type="file" accept=".txt,.csv,.cnab" onChange={handleFileChange} required className="sr-only" />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    {arquivo && (
                      <p className="text-xs text-blue-400 mt-2">{arquivo.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importando...
                  </span>
                ) : (
                  'Importar Lançamentos'
                )}
              </button>
            </form>

            {resultadoImportacao && (
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-400 font-medium">
                  ✅ {resultadoImportacao.totalImportado} lançamentos importados com sucesso!
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Formato detectado: {resultadoImportacao.formato?.toUpperCase() || 'N/A'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Aba: Lançamentos Importados */}
        {abaAtiva === 'lancamentos' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded"></div>
              Lançamentos Contábeis Importados
            </h2>

            {lancamentos.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Nenhum lançamento importado ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Vencimento</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {lancamentos.map((lanc) => (
                      <tr key={lanc.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm text-slate-300">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lanc.tipo === 'pagar' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {lanc.tipo === 'pagar' ? 'A Pagar' : 'A Receber'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{lanc.descricao}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {new Date(lanc.dataVencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(lanc.valor))}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lanc.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-400' :
                            lanc.status === 'parcialmente_conciliado' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {lanc.status === 'conciliado' ? 'Conciliado' :
                             lanc.status === 'parcialmente_conciliado' ? 'Parcial' : 'Aberto'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Aba: Executar Conciliação */}
        {abaAtiva === 'executar' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded"></div>
              Executar Conciliação Bancária
            </h2>
            <p className="text-slate-400 mb-6">
              Execute a conciliação automática comparando transações bancárias com lançamentos contábeis.
            </p>

            <form onSubmit={handleExecutarConciliacao} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Empresa *
                </label>
                <select
                  value={empresaId}
                  onChange={(e) => {
                    setEmpresaId(e.target.value);
                    if (e.target.value) {
                      carregarContas(e.target.value);
                    } else {
                      setContas([]);
                    }
                  }}
                  className="input-field"
                  required
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conta Bancária (opcional)
                </label>
                <select
                  value={contaId}
                  onChange={(e) => setContaId(e.target.value)}
                  className="input-field"
                  disabled={!empresaId}
                >
                  <option value="">Todas as contas</option>
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data Fim *
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </span>
                ) : (
                  'Executar Conciliação'
                )}
              </button>
            </form>

            {resultadoConciliacao && (
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h3 className="text-purple-400 font-bold mb-3">Resultado da Conciliação</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Conciliados</p>
                    <p className="text-emerald-400 text-2xl font-bold">
                      {resultadoConciliacao.resultado?.matchesAutomaticos || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Sugestões</p>
                    <p className="text-yellow-400 text-2xl font-bold">
                      {resultadoConciliacao.resultado?.matchesSugeridos || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Divergências</p>
                    <p className="text-red-400 text-2xl font-bold">
                      {resultadoConciliacao.resultado?.divergencias || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Lote ID</p>
                    <p className="text-blue-400 text-2xl font-bold">
                      {resultadoConciliacao.loteId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aba: Resultados */}
        {abaAtiva === 'resultados' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded"></div>
              Resultados das Conciliações
            </h2>

            {lotes.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Nenhuma conciliação executada ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {lotes.map((lote) => (
                  <div key={lote.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold">Lote #{lote.id}</h3>
                        <p className="text-slate-400 text-sm">
                          {new Date(lote.dataCriacao).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                          Período: {new Date(lote.dataInicio).toLocaleDateString('pt-BR')} a {new Date(lote.dataFim).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => carregarDetalhesLote(lote.id)}
                          className="btn-secondary text-sm"
                        >
                          Ver Detalhes
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setMenuExportAberto(menuExportAberto === lote.id ? null : lote.id)}
                            className="btn-primary text-sm"
                          >
                            Exportar
                          </button>
                          {menuExportAberto === lote.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
                              <button
                                onClick={() => {
                                  handleExportar(lote.id, 'csv');
                                  setMenuExportAberto(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-t-lg"
                              >
                                CSV
                              </button>
                              <button
                                onClick={() => {
                                  handleExportar(lote.id, 'cnab240');
                                  setMenuExportAberto(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                              >
                                CNAB 240
                              </button>
                              <button
                                onClick={() => {
                                  handleExportar(lote.id, 'cnab400');
                                  setMenuExportAberto(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                              >
                                CNAB 400
                              </button>
                              <button
                                onClick={() => {
                                  handleExportar(lote.id, 'json');
                                  setMenuExportAberto(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                              >
                                JSON
                              </button>
                              <button
                                onClick={() => {
                                  handleExportar(lote.id, 'relatorio');
                                  setMenuExportAberto(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-b-lg"
                              >
                                Relatório TXT
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Transações</p>
                        <p className="text-white font-semibold">{lote.totalTransacoes || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Lançamentos</p>
                        <p className="text-white font-semibold">{lote.totalLancamentos || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Conciliados</p>
                        <p className="text-emerald-400 font-semibold">{lote.totalConciliados || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Taxa</p>
                        <p className="text-blue-400 font-semibold">{lote.taxaConciliacao?.toFixed(1) || 0}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal de Detalhes */}
            {mostrarDetalhes && loteDetalhes && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Detalhes do Lote #{loteSelecionado}</h3>
                    <button
                      onClick={() => {
                        setMostrarDetalhes(false);
                        setLoteDetalhes(null);
                        setLoteSelecionado(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Matches Automáticos */}
                    <div>
                      <h4 className="text-lg font-semibold text-emerald-400 mb-3">
                        ✅ Matches Automáticos ({matchesAutomaticos.length})
                      </h4>
                      {matchesAutomaticos.length > 0 ? (
                        <div className="space-y-2">
                          {matchesAutomaticos.slice(0, 10).map((match: any) => (
                            <div key={match.id} className="p-3 bg-slate-700/50 rounded-lg text-sm">
                              <p className="text-slate-300">Confiança: {match.confidence}%</p>
                              <p className="text-slate-400 text-xs mt-1">{match.observacoes}</p>
                            </div>
                          ))}
                          {matchesAutomaticos.length > 10 && (
                            <p className="text-slate-400 text-sm">... e mais {matchesAutomaticos.length - 10} matches</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-400">Nenhum match automático</p>
                      )}
                    </div>

                    {/* Matches Sugeridos */}
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                        🔍 Matches Sugeridos ({matchesSugeridos.length})
                      </h4>
                      {matchesSugeridos.length > 0 ? (
                        <div className="space-y-2">
                          {matchesSugeridos.map((match: any) => (
                            <div key={match.id} className="p-3 bg-slate-700/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-slate-300 text-sm">Confiança: {match.confidence}%</p>
                                  <p className="text-slate-400 text-xs mt-1">{match.observacoes}</p>
                                  <p className="text-slate-400 text-xs mt-1">
                                    Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(match.valorConciliado))}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAprovarConciliacao(match.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm"
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => handleRejeitarConciliacao(match.id)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                  >
                                    Rejeitar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">Nenhuma sugestão pendente</p>
                      )}
                    </div>

                    {/* Divergências */}
                    <div>
                      <h4 className="text-lg font-semibold text-red-400 mb-3">
                        ⚠️ Divergências ({divergencias.length})
                      </h4>
                      {divergencias.length > 0 ? (
                        <div className="space-y-2">
                          {divergencias.slice(0, 10).map((div: any) => (
                            <div key={div.id} className="p-3 bg-slate-700/50 rounded-lg text-sm">
                              <p className="text-slate-300 font-medium">{div.tipo}</p>
                              <p className="text-slate-400 text-xs mt-1">{div.descricao}</p>
                            </div>
                          ))}
                          {divergencias.length > 10 && (
                            <p className="text-slate-400 text-sm">... e mais {divergencias.length - 10} divergências</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-400">Nenhuma divergência encontrada</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
