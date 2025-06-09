#!/bin/bash

check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Проверка $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAIL"
        return 1
    fi
}

echo "🔍 Health Check TGeasy"
echo "====================="

echo "Docker контейнеры:"
docker-compose ps

echo ""
echo "Проверка сервисов:"

# Next.js App
check_service "Next.js App" "http://localhost:3000"

# PostgreSQL
echo -n "Проверка PostgreSQL... "
if docker-compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Redis
echo -n "Проверка Redis... "
if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Adminer
check_service "Adminer" "http://localhost:8080"

echo ""
echo "📊 Использование ресурсов:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🔍 Health check завершен!"