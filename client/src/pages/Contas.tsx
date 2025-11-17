import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import Header from '../components/Header';

export default function Contas() {
  const navigate = useNavigate();
  const [contas, setContas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [formData, setFormData] = useState({
    empresaId: '',
    nome: '',
    bancoCodigo: '',
    agencia: '',
    conta: '',
    identificadorUnico: '',
  });

  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    if (empresaFiltro) {
      carregarContas(empresaFiltro);
    } else {
      carregarTodasContas();
    }
  }, [empresaFiltro]);

  const carregarEmpresas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/empresas', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
        if (data.length > 0 && !empresaFiltro) {
          setEmpresaFiltro(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const carregarContas = async (empresaId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contas/empresa/${empresaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarTodasContas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const todasContas: any[] = [];
      
      for (const empresa of empresas) {
        const response = await fetch(`/api/contas/empresa/${empresa.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          todasContas.push(...data);
        }
      }
      
      setContas(todasContas);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/contas/${editingId}` : '/api/contas';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ empresaId: '', nome: '', bancoCodigo: '', agencia: '', conta: '', identificadorUnico: '' });
        if (empresaFiltro) {
          carregarContas(empresaFiltro);
        } else {
          carregarTodasContas();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar conta');
      }
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      alert('Erro ao salvar conta');
    }
  };

  const handleEdit = (conta: any) => {
    setFormData({
      empresaId: conta.empresaId.toString(),
      nome: conta.nome || '',
      bancoCodigo: conta.bancoCodigo || '',
      agencia: conta.agencia || '',
      conta: conta.conta || '',
      identificadorUnico: conta.identificadorUnico || '',
    });
    setEditingId(conta.id);
    setShowForm(true);
  };

  const handleDelete = async (contaId: number) => {
    if (!confirm('Tem certeza que deseja inativar esta conta?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contas/${contaId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (empresaFiltro) {
          carregarContas(empresaFiltro);
        } else {
          carregarTodasContas();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao inativar conta');
      }
    } catch (error) {
      console.error('Erro ao inativar conta:', error);
      alert('Erro ao inativar conta');
    }
  };

  const getNomeEmpresa = (empresaId: number) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || 'N/A';
  };

  const bancos = [
    { codigo: '001', nome: 'Banco do Brasil' },
    { codigo: '033', nome: 'Santander' },
    { codigo: '104', nome: 'Caixa Econômica Federal' },
    { codigo: '237', nome: 'Bradesco' },
    { codigo: '341', nome: 'Itaú' },
    { codigo: '422', nome: 'Safra' },
    { codigo: '748', nome: 'Sicredi' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header 
        title="Contas Bancárias" 
        actions={
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ empresaId: '', nome: '', bancoCodigo: '', agencia: '', conta: '', identificadorUnico: '' });
              } else {
                setShowForm(true);
                setEditingId(null);
                setFormData({ empresaId: empresaFiltro || '', nome: '', bancoCodigo: '', agencia: '', conta: '', identificadorUnico: '' });
              }
            }}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
            </svg>
            {showForm ? 'Cancelar' : 'Nova Conta'}
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtro por Empresa */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Filtrar por Empresa
          </label>
          <select
            value={empresaFiltro}
            onChange={(e) => {
              setEmpresaFiltro(e.target.value);
            }}
            className="input-field"
          >
            <option value="">Todas as empresas</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </option>
            ))}
          </select>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded"></div>
              {editingId ? 'Editar Conta Bancária' : 'Cadastrar Nova Conta Bancária'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Empresa *
                </label>
                <select
                  required
                  value={formData.empresaId}
                  onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
                  className="input-field"
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
                  Nome da Conta (Referência) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Conta Corrente Principal, Poupança, Conta PJ"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Banco
                  </label>
                  <select
                    value={formData.bancoCodigo}
                    onChange={(e) => setFormData({ ...formData, bancoCodigo: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Selecione o banco</option>
                    {bancos.map((banco) => (
                      <option key={banco.codigo} value={banco.codigo}>
                        {banco.codigo} - {banco.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Agência
                  </label>
                  <input
                    type="text"
                    value={formData.agencia}
                    onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                    className="input-field"
                    placeholder="0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Número da Conta
                  </label>
                  <input
                    type="text"
                    value={formData.conta}
                    onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                    className="input-field"
                    placeholder="00000-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Identificador Único
                  </label>
                  <input
                    type="text"
                    value={formData.identificadorUnico}
                    onChange={(e) => setFormData({ ...formData, identificadorUnico: e.target.value })}
                    className="input-field"
                    placeholder="Código único de referência"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingId ? 'Atualizar Conta' : 'Salvar Conta'}
              </button>
            </form>
          </div>
        )}

        <div className="table-container">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-slate-400">Carregando...</p>
            </div>
          ) : contas.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="mt-4 text-slate-400">Nenhuma conta bancária cadastrada</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Nome da Conta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Banco
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Agência / Conta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Identificador
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                {contas.map((conta) => (
                  <tr key={conta.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {getNomeEmpresa(conta.empresaId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-white">{conta.nome}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {conta.bancoCodigo ? (
                        <span>{conta.bancoCodigo} - {bancos.find(b => b.codigo === conta.bancoCodigo)?.nome || 'N/A'}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {conta.agencia || conta.conta ? (
                        <span>{conta.agencia || '-'} / {conta.conta || '-'}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {conta.identificadorUnico || <span className="text-slate-500">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        conta.status === 'ativa' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {conta.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(conta)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(conta.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Inativar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

