ALTER TABLE `orders` ADD `idempotencyKey` varchar(36);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_idempotency_key_uq` UNIQUE(`idempotencyKey`);