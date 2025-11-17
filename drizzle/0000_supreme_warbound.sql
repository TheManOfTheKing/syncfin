CREATE TABLE `categorias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`empresaId` int NOT NULL,
	`nome` varchar(120) NOT NULL,
	`tipo` enum('entrada','saida') NOT NULL,
	`codigo` varchar(40),
	`descricao` text,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categorias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `configuracoes_white_label` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeSistema` varchar(120) NOT NULL DEFAULT 'Sistema de Conciliação Bancária',
	`logoUrl` varchar(512),
	`corPrimaria` varchar(7) NOT NULL DEFAULT '#3b82f6',
	`corSecundaria` varchar(7) NOT NULL DEFAULT '#1e40af',
	`nomeEmpresaRevendedora` varchar(180),
	`contatoSuporte` varchar(320),
	`textoSobre` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `configuracoes_white_label_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contas_bancarias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`empresaId` int NOT NULL,
	`nome` varchar(120) NOT NULL,
	`bancoCodigo` varchar(20),
	`agencia` varchar(20),
	`conta` varchar(30),
	`identificadorUnico` varchar(120),
	`status` enum('ativa','inativa') NOT NULL DEFAULT 'ativa',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contas_bancarias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `empresas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(180) NOT NULL,
	`documento` varchar(32) NOT NULL,
	`slug` varchar(120),
	`status` enum('ativa','inativa','suspensa') NOT NULL DEFAULT 'ativa',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `empresas_id` PRIMARY KEY(`id`),
	CONSTRAINT `empresas_documento_unique` UNIQUE(`documento`)
);
--> statement-breakpoint
CREATE TABLE `historico_aprendizado` (
	`id` int AUTO_INCREMENT NOT NULL,
	`empresaId` int NOT NULL,
	`descricaoOriginal` text NOT NULL,
	`descricaoLimpa` text NOT NULL,
	`categoriaId` int NOT NULL,
	`confidence` int NOT NULL,
	`usuarioId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_aprendizado_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mapeamentos_importacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`empresaId` int NOT NULL,
	`bancoCodigo` varchar(20),
	`extensao` varchar(8) NOT NULL,
	`mapaJson` text NOT NULL,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mapeamentos_importacao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`empresaId` int NOT NULL,
	`contaId` int,
	`dataOperacao` timestamp NOT NULL,
	`dataCompensacao` timestamp,
	`descricaoOriginal` text NOT NULL,
	`descricaoLimpa` text NOT NULL,
	`tipo` enum('entrada','saida') NOT NULL,
	`valor` decimal(15,2) NOT NULL,
	`saldoPos` decimal(15,2),
	`status` enum('pendente','classificacao_automatica','classificacao_manual','transferencia_interna','baixa_confianca') NOT NULL DEFAULT 'pendente',
	`categoriaId` int,
	`origem` varchar(32),
	`hashUnico` varchar(64) NOT NULL,
	`grupoTransferenciaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transacoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `empresaHashIdx` UNIQUE(`empresaId`,`hashUnico`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(180) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `usuario_empresas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`empresaId` int NOT NULL,
	`perfil` enum('admin','usuario','visualizador') NOT NULL DEFAULT 'usuario',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usuario_empresas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `empresaIdx` ON `categorias` (`empresaId`);--> statement-breakpoint
CREATE INDEX `tipoIdx` ON `categorias` (`tipo`);--> statement-breakpoint
CREATE INDEX `empresaIdx` ON `contas_bancarias` (`empresaId`);--> statement-breakpoint
CREATE INDEX `empresaIdx` ON `historico_aprendizado` (`empresaId`);--> statement-breakpoint
CREATE INDEX `categoriaIdx` ON `historico_aprendizado` (`categoriaId`);--> statement-breakpoint
CREATE INDEX `empresaIdx` ON `mapeamentos_importacao` (`empresaId`);--> statement-breakpoint
CREATE INDEX `empresaDataIdx` ON `transacoes` (`empresaId`,`dataOperacao`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `transacoes` (`status`);--> statement-breakpoint
CREATE INDEX `contaIdx` ON `transacoes` (`contaId`);