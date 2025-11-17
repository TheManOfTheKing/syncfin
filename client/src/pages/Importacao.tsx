import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import Header from '../components/Header';

export default function Importacao() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState('');
  const [contaId, setContaId] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [mapeamento, setMapeamento] = useState<any>(null);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [etapa, setEtapa] = useState<'upload' | 'mapeamento' | 'confirmacao'>('upload');
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/empresas`, {
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
      const response = await fetch(`/api/contas/empresa/${empId}`, {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
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

      const response = await fetch(`${API_URL}/api/importacao/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
        
        // Se houver mapeamento pré-salvo, usar ele; caso contrário, tentar auto-detectar
        if (data.mapeamentoPreSalvo) {
          setMapeamento(data.mapeamentoPreSalvo);
          if (data.bancoIdentificado) {
            alert(`Banco identificado: ${data.bancoIdentificado}. Mapeamento pré-salvo aplicado automaticamente.`);
          }
        } else {
          // Auto-detectar colunas
          const colunas = data.colunas || [];
          setMapeamento({
            data: colunas.find((col: string) => /data|date|dt/i.test(col)) || '',
            descricao: colunas.find((col: string) => /descri|historico|description/i.test(col)) || '',
            valor: colunas.find((col: string) => /valor|value|amount/i.test(col)) || '',
            tipo: colunas.find((col: string) => /tipo|type/i.test(col)) || '',
            saldo: colunas.find((col: string) => /saldo|balance/i.test(col)) || '',
          });
          if (data.bancoIdentificado) {
            alert(`Banco identificado: ${data.bancoIdentificado}, mas nenhum mapeamento pré-salvo encontrado.`);
          }
        }
        
        setEtapa('mapeamento');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleMapeamento = () => {
    if (!mapeamento?.data || !mapeamento?.descricao || !mapeamento?.valor) {
      alert('Mapeie pelo menos: Data, Descrição e Valor');
      return;
    }
    setEtapa('confirmacao');
  };

  const handleConfirmar = async () => {
    if (!preview || !mapeamento) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/importacao/confirmar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          empresaId,
          contaId: contaId || null,
          mapeamento,
          dados: preview.dadosCompletos || preview.preview || [],
          extensao: preview.extensao,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResultado(data);
        alert(`Importação concluída! ${data.importadas} transações importadas, ${data.classificadas} classificadas automaticamente.`);
        // Reset
        setEtapa('upload');
        setArquivo(null);
        setPreview(null);
        setMapeamento(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao confirmar importação');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao confirmar importação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header title="Importar Extrato" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {etapa === 'upload' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded"></div>
              Upload do Arquivo
            </h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Empresa *
                </label>
                <select
                  required
                  value={empresaId}
                  onChange={(e) => {
                    setEmpresaId(e.target.value);
                    if (e.target.value) carregarContas(e.target.value);
                  }}
                  className="input-field"
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
                  Arquivo (CSV ou XLSX) *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-lg hover:border-emerald-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-400">
                      <label className="relative cursor-pointer rounded-md font-medium text-emerald-400 hover:text-emerald-300">
                        <span>Selecione um arquivo</span>
                        <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} required className="sr-only" />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    {arquivo && (
                      <p className="text-xs text-emerald-400 mt-2">{arquivo.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </span>
                ) : (
                  'Fazer Upload'
                )}
              </button>
            </form>
          </div>
        )}

        {etapa === 'mapeamento' && preview && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded"></div>
              Mapeamento de Colunas
            </h2>
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-400 font-medium">
                Total de linhas: <span className="text-white">{preview.totalLinhas}</span>
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-300 mb-3">Preview (primeiras 5 linhas):</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="min-w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      {preview.colunas?.map((col: string) => (
                        <th key={col} className="px-4 py-3 border-b border-slate-700 text-left text-xs font-semibold text-slate-300 uppercase">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                    {preview.preview?.slice(0, 5).map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                        {preview.colunas?.map((col: string) => (
                          <td key={col} className="px-4 py-2 text-xs text-slate-300">
                            {String(row[col] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Coluna de Data *
                </label>
                <select
                  required
                  value={mapeamento?.data || ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, data: e.target.value })}
                  className="input-field"
                >
                  <option value="">Selecione...</option>
                  {preview.colunas?.map((col: string) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Coluna de Descrição *
                </label>
                <select
                  required
                  value={mapeamento?.descricao || ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, descricao: e.target.value })}
                  className="input-field"
                >
                  <option value="">Selecione...</option>
                  {preview.colunas?.map((col: string) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Coluna de Valor *
                </label>
                <select
                  required
                  value={mapeamento?.valor || ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, valor: e.target.value })}
                  className="input-field"
                >
                  <option value="">Selecione...</option>
                  {preview.colunas?.map((col: string) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Coluna de Tipo (opcional)
                </label>
                <select
                  value={mapeamento?.tipo || ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, tipo: e.target.value })}
                  className="input-field"
                >
                  <option value="">Não mapear</option>
                  {preview.colunas?.map((col: string) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Coluna de Saldo (opcional)
                </label>
                <select
                  value={mapeamento?.saldo || ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, saldo: e.target.value })}
                  className="input-field"
                >
                  <option value="">Não mapear</option>
                  {preview.colunas?.map((col: string) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setEtapa('upload')}
                className="btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={handleMapeamento}
                className="btn-primary bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {etapa === 'confirmacao' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded"></div>
              Confirmar Importação
            </h2>
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-lg p-6 mb-6">
              <div className="space-y-2">
                <p className="text-emerald-400">
                  <strong className="text-white">Total de linhas:</strong> {preview?.totalLinhas}
                </p>
                <p className="text-emerald-400">
                  <strong className="text-white">Mapeamento:</strong> Data → <span className="text-white">{mapeamento?.data}</span>, Descrição → <span className="text-white">{mapeamento?.descricao}</span>, Valor → <span className="text-white">{mapeamento?.valor}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEtapa('mapeamento')}
                className="btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={loading}
                className="btn-primary bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importando...
                  </span>
                ) : (
                  'Confirmar Importação'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
