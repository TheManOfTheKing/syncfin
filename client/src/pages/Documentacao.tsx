import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface Section {
  id: string;
  title: string;
  content: JSX.Element;
  category: string;
}

export default function Documentacao() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const sections: Section[] = [
    {
      id: 'introducao',
      title: 'Introdução ao FinSync',
      category: 'inicio',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            O <strong className="text-white">FinSync</strong> é um sistema completo de conciliação bancária inteligente 
            desenvolvido para empresas de pequeno e médio porte (SME/MEI). Nossa plataforma automatiza o processo de 
            reconciliação de extratos bancários, classificando transações automaticamente e detectando transferências 
            internas, economizando tempo e reduzindo erros manuais.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">✨ Principais Benefícios</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Automação inteligente de classificação de transações</li>
              <li>Detecção automática de transferências internas</li>
              <li>Múltiplas empresas e contas bancárias</li>
              <li>Relatórios executivos e exportação para Excel</li>
              <li>Interface moderna e intuitiva</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'importancia-conciliacao',
      title: 'A Importância da Conciliação Bancária',
      category: 'conceitos',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            A conciliação bancária é um processo fundamental na gestão financeira de qualquer empresa. 
            Ela consiste em comparar os registros contábeis da empresa com os extratos bancários, 
            identificando e corrigindo discrepâncias, garantindo que todas as transações estejam 
            corretamente registradas e classificadas.
          </p>
          
          <h3 className="text-xl font-bold text-white mt-6 mb-3">Por que a Conciliação é Essencial?</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <h4 className="text-emerald-400 font-semibold mb-2">💰 Controle Financeiro</h4>
              <p className="text-slate-300 text-sm">
                Permite ter visibilidade completa do fluxo de caixa, identificando todas as entradas 
                e saídas de recursos.
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">🔍 Detecção de Erros</h4>
              <p className="text-slate-300 text-sm">
                Identifica transações duplicadas, valores incorretos, ou lançamentos não reconhecidos, 
                permitindo correção imediata.
              </p>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-purple-400 font-semibold mb-2">📊 Tomada de Decisão</h4>
              <p className="text-slate-300 text-sm">
                Fornece dados precisos para análises financeiras, planejamento e tomada de decisões estratégicas.
              </p>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h4 className="text-orange-400 font-semibold mb-2">⚖️ Conformidade</h4>
              <p className="text-slate-300 text-sm">
                Garante que os registros estejam alinhados com os extratos bancários, essencial para 
                auditorias e obrigações fiscais.
              </p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
            <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Consequências da Falta de Conciliação</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Descontrole do fluxo de caixa</li>
              <li>Erros contábeis que podem gerar multas</li>
              <li>Dificuldade em identificar fraudes ou irregularidades</li>
              <li>Impossibilidade de tomar decisões baseadas em dados precisos</li>
              <li>Perda de tempo com processos manuais repetitivos</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'processo-conciliacao',
      title: 'Como Funciona o Processo de Conciliação no FinSync',
      category: 'conceitos',
      content: (
        <div className="space-y-6">
          <p className="text-slate-300 leading-relaxed">
            O FinSync automatiza o processo de conciliação bancária através de um sistema inteligente 
            em múltiplas etapas, desde a importação até a classificação final das transações.
          </p>

          <h3 className="text-xl font-bold text-white mt-6 mb-3">📋 Etapas do Processo</h3>

          <div className="space-y-4">
            <div className="bg-slate-800/50 border-l-4 border-blue-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">Importação de Extratos</h4>
                  <p className="text-slate-300 text-sm mb-2">
                    Faça upload dos extratos bancários em formato CSV ou XLSX. O sistema identifica 
                    automaticamente o banco e aplica mapeamentos pré-configurados quando disponíveis.
                  </p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    <li>Suporte para múltiplos bancos (BB, Santander, Caixa, Bradesco, Itaú, Safra, Sicredi)</li>
                    <li>Detecção automática de formato e colunas</li>
                    <li>Preview dos dados antes da importação</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border-l-4 border-emerald-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">Mapeamento e Limpeza de Dados</h4>
                  <p className="text-slate-300 text-sm mb-2">
                    O sistema mapeia automaticamente as colunas do extrato (data, descrição, valor) 
                    e limpa as descrições das transações, normalizando o texto para melhor classificação.
                  </p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    <li>Normalização de datas e valores</li>
                    <li>Limpeza de caracteres especiais</li>
                    <li>Identificação automática de entradas e saídas</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border-l-4 border-purple-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">Classificação Automática Inteligente</h4>
                  <p className="text-slate-300 text-sm mb-2">
                    O sistema utiliza inteligência artificial para classificar automaticamente as transações 
                    baseado no histórico de aprendizado. A classificação ocorre em três níveis:
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="bg-purple-500/10 rounded p-2">
                      <p className="text-purple-400 text-xs font-semibold">Nível 1: Correspondência Exata</p>
                      <p className="text-slate-300 text-xs">100% de confiança quando a descrição é idêntica ao histórico</p>
                    </div>
                    <div className="bg-purple-500/10 rounded p-2">
                      <p className="text-purple-400 text-xs font-semibold">Nível 2: Palavras-Chave</p>
                      <p className="text-slate-300 text-xs">Até 85% de confiança baseado em palavras comuns</p>
                    </div>
                    <div className="bg-purple-500/10 rounded p-2">
                      <p className="text-purple-400 text-xs font-semibold">Nível 3: Similaridade (Levenshtein)</p>
                      <p className="text-slate-300 text-xs">Até 80% de confiança baseado em similaridade de texto</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border-l-4 border-orange-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">Detecção de Transferências Internas</h4>
                  <p className="text-slate-300 text-sm mb-2">
                    O sistema identifica automaticamente transferências entre contas bancárias da mesma empresa, 
                    comparando débitos e créditos de mesmo valor em diferentes contas dentro de uma janela temporal.
                  </p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    <li>Verifica contas bancárias diferentes</li>
                    <li>Compara valores (tolerância de R$ 0,01)</li>
                    <li>Janela temporal configurável (padrão: 60 horas)</li>
                    <li>Cálculo de confiança baseado em múltiplos fatores</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border-l-4 border-cyan-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">Revisão e Classificação Manual</h4>
                  <p className="text-slate-300 text-sm mb-2">
                    Transações não classificadas automaticamente ou com baixa confiança ficam disponíveis 
                    para classificação manual. Cada classificação manual é registrada no histórico de aprendizado, 
                    melhorando a precisão das próximas importações.
                  </p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    <li>Interface otimizada para classificação rápida</li>
                    <li>Classificação em lote</li>
                    <li>Aprendizado contínuo do sistema</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
            <h4 className="text-blue-400 font-semibold mb-2">💡 Dica Importante</h4>
            <p className="text-slate-300 text-sm">
              O sistema melhora com o uso! Quanto mais você classificar transações manualmente, 
              mais preciso se torna o sistema de classificação automática. Nos primeiros usos, 
              dedique tempo à classificação manual para "ensinar" o sistema sobre seus padrões de transações.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'primeiros-passos',
      title: 'Primeiros Passos',
      category: 'guia',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Configuração Inicial</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-blue-400">1.</span> Cadastrar Empresa
              </h4>
              <p className="text-slate-300 text-sm mb-3">
                Acesse o menu <strong className="text-white">Empresas</strong> e cadastre sua empresa com:
              </p>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 ml-4">
                <li>Nome completo da empresa</li>
                <li>CNPJ ou CPF</li>
                <li>Slug (opcional - identificador único)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-emerald-400">2.</span> Cadastrar Contas Bancárias
              </h4>
              <p className="text-slate-300 text-sm mb-3">
                No menu <strong className="text-white">Contas Bancárias</strong>, cadastre cada conta bancária:
              </p>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 ml-4">
                <li>Nome de referência (ex: "Conta Corrente Principal")</li>
                <li>Banco (opcional)</li>
                <li>Agência e número da conta (opcional)</li>
                <li>Identificador único (opcional)</li>
              </ul>
              <p className="text-slate-300 text-sm mt-3">
                <strong className="text-white">Importante:</strong> Você pode cadastrar múltiplas contas por empresa, 
                o que é essencial para a detecção de transferências internas.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-purple-400">3.</span> Criar Categorias
              </h4>
              <p className="text-slate-300 text-sm mb-3">
                Configure suas categorias contábeis no menu <strong className="text-white">Categorias</strong>:
              </p>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 ml-4">
                <li>Nome da categoria</li>
                <li>Tipo: Entrada ou Saída</li>
                <li>Código (opcional - para integração contábil)</li>
                <li>Descrição (opcional)</li>
              </ul>
              <p className="text-slate-300 text-sm mt-3">
                <strong className="text-white">Exemplos de categorias:</strong> Fornecedores, Clientes, 
                Salários, Impostos, Marketing, etc.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'importacao-extrato',
      title: 'Como Importar um Extrato Bancário',
      category: 'guia',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">📤 Processo de Importação</h3>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-blue-400 font-semibold mb-2">Formatos Suportados</h4>
            <p className="text-slate-300 text-sm">
              O FinSync aceita extratos em formato <strong className="text-white">CSV</strong> ou <strong className="text-white">XLSX</strong> 
              (Excel). O arquivo deve conter pelo menos as colunas de data, descrição e valor.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Passo 1: Selecionar Empresa e Conta</h4>
              <p className="text-slate-300 text-sm mb-2">
                Na página de <strong className="text-white">Importação</strong>:
              </p>
              <ol className="list-decimal list-inside text-slate-300 text-sm space-y-1 ml-2">
                <li>Selecione a empresa no dropdown</li>
                <li>Selecione a conta bancária (opcional, mas recomendado)</li>
                <li>Clique em "Escolher arquivo" e selecione seu extrato</li>
              </ol>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Passo 2: Mapeamento de Colunas</h4>
              <p className="text-slate-300 text-sm mb-2">
                Após o upload, o sistema tentará identificar automaticamente o banco e aplicar um mapeamento pré-salvo. 
                Se não houver mapeamento, você precisará mapear manualmente:
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                <li><strong className="text-white">Coluna de Data:</strong> Selecione a coluna que contém as datas das transações</li>
                <li><strong className="text-white">Coluna de Descrição:</strong> Selecione a coluna com a descrição/histórico</li>
                <li><strong className="text-white">Coluna de Valor:</strong> Selecione a coluna com os valores</li>
                <li><strong className="text-white">Coluna de Tipo (opcional):</strong> Se houver coluna indicando entrada/saída</li>
                <li><strong className="text-white">Coluna de Saldo (opcional):</strong> Se houver informação de saldo</li>
              </ul>
              <p className="text-slate-300 text-sm mt-3">
                <strong className="text-white">Dica:</strong> O sistema salva o mapeamento para próximas importações 
                do mesmo banco, então você só precisará fazer isso uma vez por banco.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Passo 3: Revisar Preview</h4>
              <p className="text-slate-300 text-sm mb-2">
                Antes de confirmar a importação, revise o preview das primeiras transações para garantir que o mapeamento está correto:
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                <li>Verifique se as datas estão corretas</li>
                <li>Confirme se as descrições estão completas</li>
                <li>Valide se os valores estão corretos</li>
                <li>Verifique se entradas e saídas estão identificadas corretamente</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Passo 4: Confirmar Importação</h4>
              <p className="text-slate-300 text-sm mb-2">
                Ao clicar em "Confirmar Importação", o sistema irá:
              </p>
              <ol className="list-decimal list-inside text-slate-300 text-sm space-y-1 ml-2">
                <li>Verificar duplicatas (transações já importadas são ignoradas)</li>
                <li>Limpar e normalizar as descrições</li>
                <li>Tentar classificar automaticamente cada transação</li>
                <li>Salvar todas as transações no banco de dados</li>
                <li>Salvar o mapeamento para uso futuro</li>
              </ol>
              <p className="text-slate-300 text-sm mt-3">
                Você verá um resumo com: número de transações importadas, duplicadas encontradas, 
                erros (se houver) e taxa de classificação automática.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'classificacao-transacoes',
      title: 'Classificando Transações',
      category: 'guia',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">🏷️ Processo de Classificação</h3>
          
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-purple-400 font-semibold mb-2">Classificação Automática</h4>
            <p className="text-slate-300 text-sm">
              O sistema classifica automaticamente as transações durante a importação. Transações com 
              <strong className="text-white"> confiança ≥ 70%</strong> são marcadas como "Classificação Automática". 
              Transações com <strong className="text-white">confiança entre 50-69%</strong> ficam como "Baixa Confiança" 
              e precisam de revisão.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Classificação Manual Individual</h4>
              <ol className="list-decimal list-inside text-slate-300 text-sm space-y-2 ml-2">
                <li>Acesse a página <strong className="text-white">Transações</strong></li>
                <li>Use os filtros para encontrar transações pendentes ou com baixa confiança</li>
                <li>Clique na transação que deseja classificar</li>
                <li>Selecione a categoria apropriada</li>
                <li>Confirme a classificação</li>
              </ol>
              <p className="text-slate-300 text-sm mt-3">
                <strong className="text-white">Importante:</strong> Cada classificação manual é registrada no histórico 
                de aprendizado, melhorando a precisão do sistema para próximas transações similares.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Classificação em Lote</h4>
              <p className="text-slate-300 text-sm mb-2">
                Para classificar múltiplas transações de uma vez:
              </p>
              <ol className="list-decimal list-inside text-slate-300 text-sm space-y-2 ml-2">
                <li>Ative o "Modo Classificação em Lote" na página de Transações</li>
                <li>Marque as transações que deseja classificar (usando os checkboxes)</li>
                <li>Selecione a categoria desejada</li>
                <li>Clique em "Classificar Selecionadas"</li>
              </ol>
              <p className="text-slate-300 text-sm mt-3">
                <strong className="text-white">Dica:</strong> Use os filtros para encontrar transações similares 
                e classificá-las em lote, economizando tempo.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Filtros Úteis</h4>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                <li><strong className="text-white">Status:</strong> Filtre por "Pendente" ou "Baixa Confiança"</li>
                <li><strong className="text-white">Tipo:</strong> Filtre por "Entrada" ou "Saída"</li>
                <li><strong className="text-white">Período:</strong> Selecione um intervalo de datas</li>
                <li><strong className="text-white">Busca:</strong> Digite palavras-chave da descrição</li>
                <li><strong className="text-white">Categoria:</strong> Filtre por categoria específica</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'transferencias-internas',
      title: 'Detecção de Transferências Internas',
      category: 'guia',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">🔄 Transferências Entre Contas</h3>
          
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-orange-400 font-semibold mb-2">O que são Transferências Internas?</h4>
            <p className="text-slate-300 text-sm">
              Transferências internas são movimentações de dinheiro entre contas bancárias da mesma empresa. 
              Por exemplo, transferir R$ 5.000 da Conta Corrente para a Poupança. Essas transações não representam 
              receitas ou despesas reais, apenas movimentação interna de recursos.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h4 className="text-white font-semibold mb-3">Como o Sistema Detecta</h4>
            <p className="text-slate-300 text-sm mb-3">
              O FinSync identifica automaticamente transferências internas comparando:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 ml-4">
              <li><strong className="text-white">Contas diferentes:</strong> Débito em uma conta e crédito em outra</li>
              <li><strong className="text-white">Mesmo valor:</strong> Valores idênticos (tolerância de R$ 0,01)</li>
              <li><strong className="text-white">Janela temporal:</strong> Ocorridas dentro de 60 horas (configurável)</li>
              <li><strong className="text-white">Similaridade:</strong> Descrições similares aumentam a confiança</li>
            </ul>
            <p className="text-slate-300 text-sm mt-3">
              Transações identificadas como transferências internas são marcadas automaticamente e 
              <strong className="text-white"> excluídas dos relatórios de DRE e Fluxo de Caixa</strong>, 
              pois não representam receitas ou despesas reais.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">💡 Boas Práticas</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
              <li>Cadastre todas as contas bancárias da empresa para melhor detecção</li>
              <li>Importe extratos de todas as contas no mesmo período</li>
              <li>Revise as transferências detectadas para garantir precisão</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'relatorios',
      title: 'Relatórios e Exportação',
      category: 'guia',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">📊 Gerando Relatórios</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Relatório DRE/Fluxo de Caixa</h4>
              <p className="text-slate-300 text-sm mb-2">
                Gera um resumo consolidado por categoria, ideal para análise de resultados:
              </p>
              <ol className="list-decimal list-inside text-slate-300 text-sm space-y-1 ml-2">
                <li>Acesse a página <strong className="text-white">Relatórios</strong></li>
                <li>Selecione a empresa e o período desejado</li>
                <li>Clique em "Exportar DRE/Fluxo"</li>
                <li>O arquivo Excel será baixado automaticamente</li>
              </ol>
              <p className="text-slate-300 text-sm mt-3">
                <strong className="text-white">Nota:</strong> Transferências internas são automaticamente 
                excluídas deste relatório.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Exportação Detalhada</h4>
              <p className="text-slate-300 text-sm mb-2">
                Exporta todas as transações com todos os detalhes:
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                <li>Data, descrição, valor, tipo</li>
                <li>Categoria atribuída</li>
                <li>Status da classificação</li>
                <li>Conta bancária</li>
              </ul>
              <p className="text-slate-300 text-sm mt-3">
                Útil para análises detalhadas ou integração com outros sistemas.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-3">Relatório de Divergências</h4>
              <p className="text-slate-300 text-sm mb-2">
                Lista todas as transações que precisam de atenção:
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-4">
                <li>Transações pendentes (não classificadas)</li>
                <li>Transações com baixa confiança</li>
                <li>Transações com erros</li>
              </ul>
              <p className="text-slate-300 text-sm mt-3">
                Use este relatório para identificar o que ainda precisa ser revisado e classificado.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Entendendo o Dashboard',
      category: 'guia',
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">📈 KPIs e Métricas</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Transações Pendentes</h4>
              <p className="text-slate-300 text-sm">
                Número de transações aguardando classificação manual. 
                Ideal manter este número baixo para garantir dados atualizados.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Taxa de Automação</h4>
              <p className="text-slate-300 text-sm">
                Percentual de transações classificadas automaticamente. 
                Quanto maior, menos trabalho manual necessário.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Total Entradas/Saídas</h4>
              <p className="text-slate-300 text-sm">
                Soma de todas as entradas e saídas no período. 
                Útil para análise de fluxo de caixa.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Ticket Médio</h4>
              <p className="text-slate-300 text-sm">
                Valor médio das transações. 
                Ajuda a entender o perfil financeiro da empresa.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h4 className="text-white font-semibold mb-3">Distribuição por Categoria</h4>
            <p className="text-slate-300 text-sm">
              O dashboard mostra as top 10 categorias com maior volume de transações, 
              separadas por tipo (entrada/saída). Isso ajuda a identificar os principais 
              fluxos financeiros da empresa.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'duvidas-frequentes',
      title: 'Dúvidas Frequentes',
      category: 'suporte',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">O sistema detecta transações duplicadas?</h4>
              <p className="text-slate-300 text-sm">
                Sim! O FinSync gera um hash único para cada transação baseado em empresa, data, descrição e valor. 
                Se você importar o mesmo extrato duas vezes, as transações duplicadas serão ignoradas automaticamente.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Posso usar o sistema para múltiplas empresas?</h4>
              <p className="text-slate-300 text-sm">
                Sim! O FinSync é multi-tenant. Você pode cadastrar quantas empresas quiser e gerenciar todas 
                em uma única conta. Cada empresa tem seus próprios dados, contas bancárias, categorias e transações.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Como melhorar a taxa de classificação automática?</h4>
              <p className="text-slate-300 text-sm">
                Classifique manualmente as transações que o sistema não conseguiu classificar. Cada classificação 
                manual é registrada no histórico de aprendizado. Com o tempo, o sistema aprenderá seus padrões 
                e a taxa de automação aumentará significativamente.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">O que fazer se o sistema não identificar meu banco?</h4>
              <p className="text-slate-300 text-sm">
                Não há problema! Você pode mapear manualmente as colunas do extrato. O sistema salvará este 
                mapeamento e usará automaticamente nas próximas importações do mesmo banco.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Posso editar uma transação já classificada?</h4>
              <p className="text-slate-300 text-sm">
                Sim! Você pode reclassificar qualquer transação a qualquer momento. A nova classificação 
                será registrada no histórico de aprendizado.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">Os dados são seguros?</h4>
              <p className="text-slate-300 text-sm">
                Sim! O FinSync é um sistema standalone que roda localmente. Todos os dados ficam armazenados 
                no seu próprio banco de dados, sem envio para servidores externos. Você tem controle total 
                sobre seus dados financeiros.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const categories = [
    { id: 'todos', name: 'Todos', count: sections.length },
    { id: 'inicio', name: 'Início', count: sections.filter(s => s.category === 'inicio').length },
    { id: 'conceitos', name: 'Conceitos', count: sections.filter(s => s.category === 'conceitos').length },
    { id: 'guia', name: 'Guia Prático', count: sections.filter(s => s.category === 'guia').length },
    { id: 'suporte', name: 'Suporte', count: sections.filter(s => s.category === 'suporte').length },
  ];

  // Texto de busca para cada seção (para busca mais eficiente)
  const sectionSearchText: Record<string, string> = {
    'introducao': 'introdução finsync sistema conciliação bancária automação inteligente',
    'importancia-conciliacao': 'importância conciliação bancária controle financeiro detecção erros tomada decisão conformidade',
    'processo-conciliacao': 'processo conciliação importação mapeamento classificação automática transferências internas revisão manual etapas',
    'primeiros-passos': 'primeiros passos configuração inicial cadastrar empresa contas bancárias categorias',
    'importacao-extrato': 'importar extrato bancário csv xlsx mapeamento colunas preview confirmar importação',
    'classificacao-transacoes': 'classificar transações manual lote filtros pendente baixa confiança',
    'transferencias-internas': 'transferências internas contas diferentes detecção automática janela temporal',
    'relatorios': 'relatórios exportação dre fluxo caixa divergências excel',
    'dashboard': 'dashboard kpis métricas transações pendentes taxa automação distribuição categorias',
    'duvidas-frequentes': 'dúvidas frequentes perguntas respostas duplicatas múltiplas empresas segurança dados',
  };

  const filteredSections = sections.filter(section => {
    const searchText = sectionSearchText[section.id] || '';
    const matchesSearch = searchTerm === '' || 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'todos' || section.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (filteredSections.length > 0) {
      // Se a seção atual não está nos resultados filtrados, seleciona a primeira
      if (!selectedSection || !filteredSections.find(s => s.id === selectedSection)) {
        setSelectedSection(filteredSections[0].id);
      }
    } else {
      setSelectedSection(null);
    }
  }, [filteredSections, selectedSection]);

  const currentSection = sections.find(s => s.id === selectedSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header title="Manual do Usuário" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Navegação */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              {/* Busca */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar no manual..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              {/* Filtros por Categoria */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Categorias</h3>
                <div className="space-y-1">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSection(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      {cat.name} <span className="text-xs opacity-75">({cat.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Índice */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Índice</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {filteredSections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSection === section.id
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {currentSection ? (
              <div className="card">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded"></div>
                  {currentSection.title}
                </h2>
                <div className="prose prose-invert max-w-none">
                  {currentSection.content}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <svg className="mx-auto h-12 w-12 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400">Nenhum resultado encontrado para sua busca.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

