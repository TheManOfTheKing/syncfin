// Configuração da URL da API
// Em desenvolvimento: usa proxy do Vite (localhost:3000)
// Em produção: usa variável de ambiente VITE_API_URL ou Railway URL

const getApiUrl = () => {
  // Se estiver em desenvolvimento, usa o proxy do Vite
  if (import.meta.env.DEV) {
    return '';
  }
  
  // Em produção, usa a variável de ambiente ou fallback
  return import.meta.env.VITE_API_URL || '';
};

export const API_URL = getApiUrl();

// Helper para fazer requisições com a URL correta
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  return fetch(url, options);
};

