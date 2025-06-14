#!/bin/bash

# Скрипт для ЕДИНОРАЗОВОЙ первоначальной настройки сервера

echo "🚀 Starting one-time server provisioning..."

# 1. Обновление системы
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Установка базовых утилит и Docker
echo "🐳 Installing Docker and required utilities..."
apt install -y curl git ufw # Убрали nginx и certbot
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# 3. Установка Docker Compose
echo "🎼 Installing Docker Compose..."
# Получаем последнюю стабильную версию
LATEST_COMPOSE=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep "tag_name" | cut -d : -f 2,3 | tr -d '",v ')
curl -L "https://github.com/docker/compose/releases/download/v${LATEST_COMPOSE}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose --version # Проверяем, что установилось

# 4. Создание рабочей директории для деплоя
PROJECT_DIR="/root/my-tg-app"
echo "📁 Creating project directory at ${PROJECT_DIR}..."
mkdir -p ${PROJECT_DIR}

# 5. Настройка Firewall
echo "🔥 Setting up firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

echo "✅ Server provisioning complete!"
echo "-------------------------------------"
echo "✅ Server is now ready for deployments from GitHub Actions."
echo "📋 Next steps:"
echo "1. Ensure your domain's A-record points to this server's IP."
echo "2. Ensure all required secrets are set in your GitHub repository."
echo "3. Push to the 'main' branch to trigger the first deployment."