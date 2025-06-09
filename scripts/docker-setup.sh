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

# Проверяем, запущен ли Docker
if ! docker info >/dev/null 2>&1; then
  echo "Docker не запущен. Пожалуйста, запустите Docker и попробуйте снова."
  exit 1
fi

# Создаем сеть, если она не существует
docker network inspect tgeasy-net >/dev/null 2>&1 || \
  (echo "Создание сети tgeasy-net..." && docker network create tgeasy-net)

# Проверяем наличие файла .env.local
if [ ! -f .env.local ]; then
    echo "Файл .env.local не найден. Создание из .env.example..."
    if [ ! -f .env.example ]; then
        echo "Ошибка: .env.example не найден. Пожалуйста, создайте его."
        exit 1
    fi
    cp .env.example .env.local
    echo "Файл .env.local успешно создан."
    echo "Пожалуйста, проверьте и обновите его для локальной разработки, если необходимо."
fi

echo "Запуск Docker контейнеров в фоновом режиме..."
docker-compose up -d --build

echo ""
echo "✅ Docker окружение успешно запущено!"
echo "   - Приложение доступно по адресу: http://localhost:3000"
echo "   - База данных PostgreSQL доступна на порту: 5432"
echo "   - Redis доступен на порту: 6379"
echo ""
echo "Для остановки окружения используйте команду: docker-compose down"