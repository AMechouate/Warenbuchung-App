#!/bin/bash

# Warenbuchung App - Deployment Script
# Verwendung: ./deploy.sh [backend|frontend|all]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Warenbuchung App - Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Funktion: Backend deployen
deploy_backend() {
    echo -e "${GREEN}📦 Backend wird deployed...${NC}"
    
    # Prüfe ob Docker installiert ist
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker ist nicht installiert!${NC}"
        echo "Installiere Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    cd backend
    
    # Docker Image bauen
    echo "🔨 Docker Image wird gebaut..."
    docker-compose build
    
    # Container starten
    echo "🚀 Container wird gestartet..."
    docker-compose up -d
    
    # Status prüfen
    echo "✅ Backend Status:"
    docker-compose ps
    
    echo ""
    echo -e "${GREEN}✅ Backend erfolgreich deployed!${NC}"
    echo "Backend läuft auf: http://localhost:5232"
    echo "Swagger UI: http://localhost:5232/swagger"
    
    cd ..
}

# Funktion: Frontend bauen
deploy_frontend() {
    echo -e "${GREEN}📱 Frontend wird gebaut...${NC}"
    
    cd frontend/WarenbuchungApp
    
    # Prüfe ob eas-cli installiert ist
    if ! command -v eas &> /dev/null; then
        echo "📦 EAS CLI wird installiert..."
        npm install -g eas-cli
    fi
    
    # Prüfe ob eingeloggt
    echo "🔐 Prüfe Expo Login..."
    if ! eas whoami &> /dev/null; then
        echo "Bitte logge dich bei Expo ein:"
        npx expo login
    fi
    
    # Build-Typ auswählen
    echo ""
    echo "Welchen Build möchtest du erstellen?"
    echo "1) Development (für Tests, ohne App Store)"
    echo "2) Preview (für TestFlight)"
    echo "3) Production (für App Store)"
    read -p "Wähle (1-3): " build_type
    
    case $build_type in
        1)
            echo "🔨 Development Build wird erstellt..."
            npx eas build --platform ios --profile development
            ;;
        2)
            echo "🔨 Preview Build wird erstellt..."
            npx eas build --platform ios --profile preview
            ;;
        3)
            echo "🔨 Production Build wird erstellt..."
            npx eas build --platform ios --profile production
            ;;
        *)
            echo -e "${RED}❌ Ungültige Auswahl${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}✅ Build wurde gestartet!${NC}"
    echo "Der Build dauert ca. 10-20 Minuten."
    echo "Du bekommst eine E-Mail wenn der Build fertig ist."
    
    cd ../..
}

# Hauptlogik
case "$1" in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    all)
        deploy_backend
        echo ""
        deploy_frontend
        ;;
    *)
        echo "Verwendung: ./deploy.sh [backend|frontend|all]"
        echo ""
        echo "Beispiele:"
        echo "  ./deploy.sh backend   - Nur Backend deployen"
        echo "  ./deploy.sh frontend  - Nur Frontend bauen"
        echo "  ./deploy.sh all       - Beides"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Fertig!${NC}"







































