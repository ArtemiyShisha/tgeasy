#!/bin/bash

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Проверка зависимостей
check_dependencies() {
    print_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose не установлен"
        exit 1
    fi
    
    print_success "Все зависимости установлены"
}

# Создание .env файла
setup_env() {
    if [ ! -f ".env.local" ]; then
        print_info "Создание .env.local файла..."
        cp .env.docker .env.local
        print_success ".env.local создан"
        print_warning "Обновите API ключи в .env.local"
    else
        print_info ".env.local уже существует"
    fi
}

# Создание директорий
create_directories() {
    print_info "Создание директорий..."
    
    directories=(
        "logs"
        "data/postgres"
        "data/redis"
        "scripts"
        "backups"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done
    
    print_success "Директории созданы"
}

# Создание init script для БД
create_db_init() {
    print_info "Создание init-db.sql..."
    
    cat > scripts/init-db.sql << 'EOF'
-- Тестовый пользователь для разработки
INSERT INTO users (id, telegram_id, telegram_username, telegram_first_name, email, company_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  123456789,
  'developer',
  'Developer',
  'dev@tgeasy.com',
  'TGeasy Development'
) ON CONFLICT (telegram_id) DO NOTHING;

-- Активная подписка
INSERT INTO user_subscriptions (
  user_id, 
  plan, 
  max_channels, 
  max_posts_per_month, 
  price_kopecks, 
  expires_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'professional',
  15,
  200,
  699000,
  NOW() + INTERVAL '1 year'
) ON CONFLICT DO NOTHING;

SELECT 'TGeasy Development Database initialized!' as message;
EOF
    
    print_success "init-db.sql создан"
}

# Запуск сервисов
start_services() {
    print_info "Запуск Docker сервисов..."
    
    docker-compose down 2>/dev/null || true
    docker-compose up --build -d
    
    print_info "Ожидание запуска сервисов..."
    sleep 15
    
    if docker-compose ps | grep -q "Up"; then
        print_success "Сервисы запущены!"
        
        echo ""
        print_info "🌐 Доступные сервисы:"
        echo "  • Next.js App:    http://localhost:3000"
        echo "  • Database UI:    http://localhost:8080"
        echo "  • PostgreSQL:     localhost:5432"
        echo "  • Redis:          localhost:6379"
        
        echo ""
        print_info "📊 Учетные данные БД:"
        echo "  • Database: tgeasy"
        echo "  • Username: postgres"
        echo "  • Password: postgres"
        
    else
        print_error "Ошибка запуска сервисов"
        docker-compose logs
        exit 1
    fi
}

# Остановка сервисов
stop_services() {
    print_info "Остановка сервисов..."
    docker-compose down
    print_success "Сервисы остановлены"
}

# Очистка
cleanup() {
    print_warning "Очистка Docker ресурсов..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Очистка завершена"
}

# Логи
show_logs() {
    service=${1:-""}
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# Backup БД
backup_db() {
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backups/tgeasy_backup_${timestamp}.sql"
    
    print_info "Создание backup..."
    mkdir -p backups
    
    docker-compose exec -T db pg_dump -U postgres tgeasy > "$backup_file"
    
    if [ $? -eq 0 ]; then
        print_success "Backup создан: $backup_file"
    else
        print_error "Ошибка backup"
        exit 1
    fi
}

# Restore БД
restore_db() {
    backup_file=$1
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        print_error "Укажите корректный файл backup"
        exit 1
    fi
    
    print_warning "Восстановление БД из: $backup_file"
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS tgeasy;"
        docker-compose exec -T db psql -U postgres -c "CREATE DATABASE tgeasy;"
        docker-compose exec -T db psql -U postgres tgeasy < "$backup_file"
        print_success "БД восстановлена"
    fi
}

# Помощь
show_help() {
    echo "TGeasy Docker Setup Script"
    echo ""
    echo "Команды:"
    echo "  start     - Запустить все сервисы"
    echo "  stop      - Остановить все сервисы"
    echo "  restart   - Перезапустить сервисы"
    echo "  cleanup   - Очистить все ресурсы"
    echo "  logs      - Показать логи"
    echo "  backup    - Создать backup БД"
    echo "  restore   - Восстановить БД"
    echo "  status    - Статус сервисов"
    echo "  help      - Показать справку"
}

# Основная функция
main() {
    command=${1:-"start"}
    
    case $command in
        "start")
            check_dependencies
            setup_env
            create_directories
            create_db_init
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services
            ;;
        "cleanup")
            cleanup
            ;;
        "logs")
            show_logs $2
            ;;
        "backup")
            backup_db
            ;;
        "restore")
            restore_db $2
            ;;
        "status")
            docker-compose ps
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Неизвестная команда: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"