.PHONY: help start stop restart logs clean backup status health

help:
	@echo "TGeasy Docker Commands:"
	@echo "  make start     - Запустить все сервисы"
	@echo "  make stop      - Остановить все сервисы"
	@echo "  make restart   - Перезапустить сервисы"
	@echo "  make logs      - Показать логи"
	@echo "  make clean     - Очистить все ресурсы"
	@echo "  make backup    - Создать backup БД"
	@echo "  make status    - Статус контейнеров"
	@echo "  make health    - Health check сервисов"

start:
	@chmod +x scripts/docker-setup.sh
	@./scripts/docker-setup.sh start

stop:
	@./scripts/docker-setup.sh stop

restart:
	@./scripts/docker-setup.sh restart

logs:
	@docker-compose logs -f

clean:
	@./scripts/docker-setup.sh cleanup

backup:
	@./scripts/docker-setup.sh backup

status:
	@docker-compose ps

health:
	@chmod +x scripts/health-check.sh
	@./scripts/health-check.sh