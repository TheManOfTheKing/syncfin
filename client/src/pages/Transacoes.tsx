import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api';
import Header from '../components/Header';

export default function Transacoes() {
  const navigate = useNavigate();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [filtros, setFiltros] = useState({
    status: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
    busca: '',
    categoriaId: '',
  });
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<Set<number>>(new Set());
  const [modoLote, setModoLote] = useState(false);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      carregarTransacoes();
      carregarEstatisticas();
      carregarCategorias();
    }
  }, [empresaSelecionada, filtros]);

  const carregarEmpresas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`buildApiUrl('/api/empresas')`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
        if (data.length > 0) {
          setEmpresaSelecionada(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const carregarCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/categorias/empresa/${empresaSelecionada}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarTransacoes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);

      const response = await fetch(`/api/transacoes/empresa/${empresaSelecionada}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        let data = await response.json();
        
        // Filtrar por busca (descrição) se fornecido
        if (filtros.busca) {
          const buscaLower = filtros.busca.toLowerCase();
          data = data.filter((t: any) => 
            t.descricaoOriginal?.toLowerCase().includes(buscaLower) ||
            t.descricaoLimpa?.toLowerCase().includes(buscaLower)
          );
        }
        
        // Filtrar por categoria se fornecido
        if (filtros.categoriaId) {
          data = data.filter((t: any) => t.categoriaId === parseInt(filtros.categoriaId));
        }
        
        setTransacoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/transacoes/empresa/${empresaSelecionada}/estatisticas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEstatisticas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleClassificar = async (transacaoId: number, categoriaId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/transacoes/${transacaoId}/classificar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoriaId }),
      });

      if (response.ok) {
        carregarTransacoes();
        carregarEstatisticas();
        // Remover da seleção se estiver em modo lote
        if (modoLote) {
          setTransacoesSelecionadas(prev => {
            const novo = new Set(prev);
            novo.delete(transacaoId);
            return novo;
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao classificar');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao classificar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleClassificarLote = async (categoriaId: number) => {
    if (transacoesSelecionadas.size === 0) {
      alert('Selecione pelo menos uma transação');
      return;
    }

    if (!confirm(`Classificar ${transacoesSelecionadas.size} transação(ões) com esta categoria?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(transacoesSelecionadas).map(id =>
        fetch(`/api/transacoes/${id}/classificar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ categoriaId }),
        })
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.ok);

      if (errors.length === 0) {
        alert(`${transacoesSelecionadas.size} transação(ões) classificada(s) com sucesso!`);
        setTransacoesSelecionadas(new Set());
        setModoLote(false);
        carregarTransacoes();
        carregarEstatisticas();
      } else {
        alert(`Erro ao classificar ${errors.length} transação(ões)`);
      }
    } catch (error) {
      console.error('Erro ao classificar em lote:', error);
      alert('Erro ao classificar transações');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecao = (id: number) => {
    setTransacoesSelecionadas(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  };

  const toggleSelecionarTodas = () => {
    const pendentes = transacoes.filter(t => !t.categoriaId);
    if (transacoesSelecionadas.size === pendentes.length) {
      setTransacoesSelecionadas(new Set());
    } else {
      setTransacoesSelecionadas(new Set(pendentes.map(t => t.id)));
    }
  };

  const formatarValor = (valor: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(valor));
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header title="Transações" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Empresa
              </label>
              <select
                value={empresaSelecionada}
                onChange={(e) => setEmpresaSelecionada(e.target.value)}
                className="input-field"
              >
                <option value="">Selecione...</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="classificacao_automatica">Automática</option>
                <option value="classificacao_manual">Manual</option>
                <option value="transferencia_interna">Transferência</option>
                <option value="baixa_confianca">Baixa Confiança</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Categoria
              </label>
              <select
                value={filtros.categoriaId}
                onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
                className="input-field"
              >
                <option value="">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
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
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar por descrição
            </label>
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              placeholder="Digite para buscar..."
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setFiltros({ status: '', tipo: '', dataInicio: '', dataFim: '', busca: '', categoriaId: '' });
              }}
              className="btn-secondary text-sm"
            >
              Limpar Filtros
            </button>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modoLote}
                  onChange={(e) => {
                    setModoLote(e.target.checked);
                    if (!e.target.checked) {
                      setTransacoesSelecionadas(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Modo Classificação em Lote</span>
              </label>
              {modoLote && transacoesSelecionadas.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 text-sm">
                    {transacoesSelecionadas.size} selecionada(s)
                  </span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleClassificarLote(parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="input-field text-sm py-1.5"
                  >
                    <option value="">Classificar selecionadas...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card bg-gradient-to-br from-slate-700/50 to-slate-800/50">
              <p className="text-sm text-slate-400 mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{estatisticas.total}</p>
            </div>
            <div className="card bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-yellow-500/30">
              <p className="text-sm text-slate-400 mb-1">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-400">{estatisticas.pendentes}</p>
            </div>
            <div className="card bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border-emerald-500/30">
              <p className="text-sm text-slate-400 mb-1">Taxa Automação</p>
              <p className="text-3xl font-bold text-emerald-400">{estatisticas.taxaAutomacao}%</p>
            </div>
            <div className={`card ${estatisticas.saldo >= 0 ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border-emerald-500/30' : 'bg-gradient-to-br from-red-600/20 to-red-700/20 border-red-500/30'}`}>
              <p className="text-sm text-slate-400 mb-1">Saldo</p>
              <p className={`text-3xl font-bold ${estatisticas.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatarValor(estatisticas.saldo.toString())}
              </p>
            </div>
          </div>
        )}

        {/* Tabela de Transações */}
        <div className="table-container">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-slate-400">Carregando...</p>
            </div>
          ) : transacoes.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-4 text-slate-400">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="table-header">
                  <tr>
                    {modoLote && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={transacoesSelecionadas.size === transacoes.filter(t => !t.categoriaId).length && transacoes.filter(t => !t.categoriaId).length > 0}
                          onChange={toggleSelecionarTodas}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                  {transacoes.map((trans) => (
                    <tr 
                      key={trans.id} 
                      className={`table-row ${modoLote && transacoesSelecionadas.has(trans.id) ? 'bg-purple-500/10' : ''} ${!trans.categoriaId ? 'border-l-2 border-yellow-500/50' : ''}`}
                    >
                      {modoLote && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!trans.categoriaId && (
                            <input
                              type="checkbox"
                              checked={transacoesSelecionadas.has(trans.id)}
                              onChange={() => toggleSelecao(trans.id)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {formatarData(trans.dataOperacao)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white max-w-xs truncate" title={trans.descricaoOriginal}>
                        {trans.descricaoOriginal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          trans.tipo === 'entrada' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {trans.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        trans.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatarValor(trans.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {trans.categoria?.nome || <span className="text-yellow-400 font-medium">⚠️ Sem categoria</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          trans.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          trans.status === 'classificacao_automatica' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          trans.status === 'classificacao_manual' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          trans.status === 'baixa_confianca' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {trans.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!trans.categoriaId && categorias.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleClassificar(trans.id, parseInt(e.target.value));
                                e.target.value = '';
                              }
                            }}
                            className="text-xs input-field py-1.5 px-2"
                            disabled={loading}
                          >
                            <option value="">Classificar...</option>
                            {categorias.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nome}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
