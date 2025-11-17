// Configuração da URL da API
// Em desenvolvimento: usa proxy do Vite (localhost:3000)
// Em produção: usa variável de ambiente VITE_API_URL (Railway URL)

const getApiUrl = () => {
  // Se estiver em desenvolvimento, usa string vazia (proxy do Vite)
  if (import.meta.env.DEV) {
    return '';
  }
  
  // Em produção, DEVE ter a variável VITE_API_URL configurada na Vercel
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    console.error('❌ ERRO: VITE_API_URL não configurada!');
    console.error('Configure a variável de ambiente VITE_API_URL na Vercel com a URL do Railway');
    console.error('Exemplo: https://seu-backend.up.railway.app');
  }
  
  return apiUrl || '';
};

export const API_URL = getApiUrl();

// Helper para fazer requisições com a URL correta
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  // Log apenas em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`🔗 API Request: ${url}`);
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include', // Importante para cookies (JWT)
  });
};

// Informações de configuração (útil para debug)
export const getApiConfig = () => ({
  apiUrl: API_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
});
