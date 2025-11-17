-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 17-Nov-2025 às 15:37
-- Versão do servidor: 10.4.27-MariaDB
-- versão do PHP: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `conciliacao_bancaria`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `empresaId` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `codigo` varchar(40) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `configuracoes_white_label`
--

CREATE TABLE `configuracoes_white_label` (
  `id` int(11) NOT NULL,
  `nomeSistema` varchar(120) NOT NULL DEFAULT 'Sistema de Conciliação Bancária',
  `logoUrl` varchar(512) DEFAULT NULL,
  `corPrimaria` varchar(7) NOT NULL DEFAULT '#3b82f6',
  `corSecundaria` varchar(7) NOT NULL DEFAULT '#1e40af',
  `nomeEmpresaRevendedora` varchar(180) DEFAULT NULL,
  `contatoSuporte` varchar(320) DEFAULT NULL,
  `textoSobre` text DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `configuracoes_white_label`
--

INSERT INTO `configuracoes_white_label` (`id`, `nomeSistema`, `logoUrl`, `corPrimaria`, `corSecundaria`, `nomeEmpresaRevendedora`, `contatoSuporte`, `textoSobre`, `updatedAt`) VALUES
(1, 'Sistema de Conciliação Bancária', NULL, '#3b82f6', '#1e40af', NULL, NULL, NULL, '2025-11-17 05:54:52');

-- --------------------------------------------------------

--
-- Estrutura da tabela `contas_bancarias`
--

CREATE TABLE `contas_bancarias` (
  `id` int(11) NOT NULL,
  `empresaId` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `bancoCodigo` varchar(20) DEFAULT NULL,
  `agencia` varchar(20) DEFAULT NULL,
  `conta` varchar(30) DEFAULT NULL,
  `identificadorUnico` varchar(120) DEFAULT NULL,
  `status` enum('ativa','inativa') NOT NULL DEFAULT 'ativa',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `empresas`
--

CREATE TABLE `empresas` (
  `id` int(11) NOT NULL,
  `nome` varchar(180) NOT NULL,
  `documento` varchar(32) NOT NULL,
  `slug` varchar(120) DEFAULT NULL,
  `status` enum('ativa','inativa','suspensa') NOT NULL DEFAULT 'ativa',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `historico_aprendizado`
--

CREATE TABLE `historico_aprendizado` (
  `id` int(11) NOT NULL,
  `empresaId` int(11) NOT NULL,
  `descricaoOriginal` text NOT NULL,
  `descricaoLimpa` text NOT NULL,
  `categoriaId` int(11) NOT NULL,
  `confidence` int(11) NOT NULL,
  `usuarioId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `mapeamentos_importacao`
--

CREATE TABLE `mapeamentos_importacao` (
  `id` int(11) NOT NULL,
  `empresaId` int(11) NOT NULL,
  `bancoCodigo` varchar(20) DEFAULT NULL,
  `extensao` varchar(8) NOT NULL,
  `mapaJson` text NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `transacoes`
--

CREATE TABLE `transacoes` (
  `id` int(11) NOT NULL,
  `empresaId` int(11) NOT NULL,
  `contaId` int(11) DEFAULT NULL,
  `dataOperacao` datetime NOT NULL,
  `dataCompensacao` datetime DEFAULT NULL,
  `descricaoOriginal` text NOT NULL,
  `descricaoLimpa` text NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `valor` decimal(15,2) NOT NULL,
  `saldoPos` decimal(15,2) DEFAULT NULL,
  `status` enum('pendente','classificacao_automatica','classificacao_manual','transferencia_interna','baixa_confianca') NOT NULL DEFAULT 'pendente',
  `categoriaId` int(11) DEFAULT NULL,
  `origem` varchar(32) DEFAULT NULL,
  `hashUnico` varchar(64) NOT NULL,
  `grupoTransferenciaId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(320) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(180) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `ativo`, `createdAt`, `updatedAt`) VALUES
(2, 'delmondesadv@gmail.com', '$2a$10$O0Q3ftWZCnb1aXkQkHMWDO0gVZ4csCXzOaY7pOJl75af83YKTd9w6', 'André de Sales Delmondes', 'admin', 1, '2025-11-17 05:55:49', '2025-11-17 06:10:39'),
(3, 'email@example.com', '$2a$10$16ov6uguYfpqgRn.HDV6fuAllo1Hi7NyJWmUgNVNsv2mzfbDgNEpK', 'Usuário de Teste', 'user', 1, '2025-11-17 13:41:51', '2025-11-17 13:41:51');

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuario_empresas`
--

CREATE TABLE `usuario_empresas` (
  `id` int(11) NOT NULL,
  `usuarioId` int(11) NOT NULL,
  `empresaId` int(11) NOT NULL,
  `perfil` enum('admin','usuario','visualizador') NOT NULL DEFAULT 'usuario',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_empresa` (`empresaId`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_ativo` (`ativo`);

--
-- Índices para tabela `configuracoes_white_label`
--
ALTER TABLE `configuracoes_white_label`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `contas_bancarias`
--
ALTER TABLE `contas_bancarias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_empresa` (`empresaId`),
  ADD KEY `idx_status` (`status`);

--
-- Índices para tabela `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documento` (`documento`),
  ADD KEY `idx_documento` (`documento`),
  ADD KEY `idx_status` (`status`);

--
-- Índices para tabela `historico_aprendizado`
--
ALTER TABLE `historico_aprendizado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_empresa` (`empresaId`),
  ADD KEY `idx_categoria` (`categoriaId`);

--
-- Índices para tabela `mapeamentos_importacao`
--
ALTER TABLE `mapeamentos_importacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_empresa` (`empresaId`),
  ADD KEY `idx_ativo` (`ativo`);

--
-- Índices para tabela `transacoes`
--
ALTER TABLE `transacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_empresa_hash` (`empresaId`,`hashUnico`),
  ADD KEY `idx_empresa_data` (`empresaId`,`dataOperacao`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_conta` (`contaId`),
  ADD KEY `idx_categoria` (`categoriaId`);

--
-- Índices para tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Índices para tabela `usuario_empresas`
--
ALTER TABLE `usuario_empresas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usuario_empresa` (`usuarioId`,`empresaId`),
  ADD KEY `idx_usuario` (`usuarioId`),
  ADD KEY `idx_empresa` (`empresaId`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `configuracoes_white_label`
--
ALTER TABLE `configuracoes_white_label`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `contas_bancarias`
--
ALTER TABLE `contas_bancarias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico_aprendizado`
--
ALTER TABLE `historico_aprendizado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `mapeamentos_importacao`
--
ALTER TABLE `mapeamentos_importacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `transacoes`
--
ALTER TABLE `transacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `usuario_empresas`
--
ALTER TABLE `usuario_empresas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
