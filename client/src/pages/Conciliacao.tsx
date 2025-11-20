import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildApiUrl } from '../config/api';
import Header from '../components/Header';

export default function Conciliacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const abaInicial = (searchParams.get('aba') as 'importar' | 'executar' | 'resultados') || 'importar';
  const [abaAtiva, setAbaAtiva] = useState<'importar' | 'executar' | 'resultados'>(abaInicial);
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

  useEffect(() => {
    carregarEmpresas();
    carregarLotes();
  }, []);

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
                      {resultadoConciliacao.estatisticas?.conciliadosAutomaticos || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Sugestões</p>
                    <p className="text-yellow-400 text-2xl font-bold">
                      {resultadoConciliacao.estatisticas?.sugestoes || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Divergências</p>
                    <p className="text-red-400 text-2xl font-bold">
                      {resultadoConciliacao.estatisticas?.divergencias || 0}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">Lote #{lote.id}</h3>
                        <p className="text-slate-400 text-sm">
                          {new Date(lote.dataCriacao).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Navegar para detalhes do lote
                            alert(`Detalhes do lote ${lote.id} - Funcionalidade em desenvolvimento`);
                          }}
                          className="btn-secondary text-sm"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

