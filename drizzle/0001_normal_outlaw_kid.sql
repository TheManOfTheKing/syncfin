ALTER TABLE `transacoes` DROP INDEX `empresaHashIdx`;--> statement-breakpoint
DROP INDEX `empresaIdx` ON `categorias`;--> statement-breakpoint
DROP INDEX `tipoIdx` ON `categorias`;--> statement-breakpoint
DROP INDEX `empresaIdx` ON `contas_bancarias`;--> statement-breakpoint
DROP INDEX `empresaIdx` ON `historico_aprendizado`;--> statement-breakpoint
DROP INDEX `categoriaIdx` ON `historico_aprendizado`;--> statement-breakpoint
DROP INDEX `empresaIdx` ON `mapeamentos_importacao`;--> statement-breakpoint
DROP INDEX `empresaDataIdx` ON `transacoes`;--> statement-breakpoint
DROP INDEX `statusIdx` ON `transacoes`;--> statement-breakpoint
DROP INDEX `contaIdx` ON `transacoes`;--> statement-breakpoint
ALTER TABLE `transacoes` MODIFY COLUMN `dataOperacao` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `transacoes` MODIFY COLUMN `dataCompensacao` datetime;--> statement-breakpoint
ALTER TABLE `transacoes` ADD CONSTRAINT `unique_empresa_hash` UNIQUE(`empresaId`,`hashUnico`);--> statement-breakpoint
ALTER TABLE `usuario_empresas` ADD CONSTRAINT `unique_usuario_empresa` UNIQUE(`usuarioId`,`empresaId`);--> statement-breakpoint
CREATE INDEX `idx_empresa` ON `categorias` (`empresaId`);--> statement-breakpoint
CREATE INDEX `idx_tipo` ON `categorias` (`tipo`);--> statement-breakpoint
CREATE INDEX `idx_ativo` ON `categorias` (`ativo`);--> statement-breakpoint
CREATE INDEX `idx_empresa` ON `contas_bancarias` (`empresaId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `contas_bancarias` (`status`);--> statement-breakpoint
CREATE INDEX `idx_documento` ON `empresas` (`documento`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `empresas` (`status`);--> statement-breakpoint
CREATE INDEX `idx_empresa` ON `historico_aprendizado` (`empresaId`);--> statement-breakpoint
CREATE INDEX `idx_categoria` ON `historico_aprendizado` (`categoriaId`);--> statement-breakpoint
CREATE INDEX `idx_empresa` ON `mapeamentos_importacao` (`empresaId`);--> statement-breakpoint
CREATE INDEX `idx_ativo` ON `mapeamentos_importacao` (`ativo`);--> statement-breakpoint
CREATE INDEX `idx_empresa_data` ON `transacoes` (`empresaId`,`dataOperacao`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `transacoes` (`status`);--> statement-breakpoint
CREATE INDEX `idx_conta` ON `transacoes` (`contaId`);--> statement-breakpoint
CREATE INDEX `idx_categoria` ON `transacoes` (`categoriaId`);--> statement-breakpoint
CREATE INDEX `idx_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_role` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `idx_usuario` ON `usuario_empresas` (`usuarioId`);--> statement-breakpoint
CREATE INDEX `idx_empresa` ON `usuario_empresas` (`empresaId`);