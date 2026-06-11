#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════════════════════╗"
echo "║                    Verificando Estado del ICD Docker                           ║"
echo "╚════════════════════════════════════════════════════════════════════════════════╝"

echo ""
echo "1️⃣ Verificando si Docker está corriendo..."
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker no está instalado"
    exit 1
fi

echo "   ✅ Docker encontrado"

echo ""
echo "2️⃣ Buscando contenedor ICD..."
CONTAINER_NAME=$(docker ps -a --format '{{.Names}}' | grep -i icd)

if [ -z "$CONTAINER_NAME" ]; then
    echo "   ❌ No hay contenedor ICD en el sistema"
    echo ""
    echo "   Para crear uno, ejecuta:"
    echo "   docker run -d -p 8090:8080 --name icd11 <image-name>"
else
    echo "   ✅ Contenedor encontrado: $CONTAINER_NAME"
    
    # Verificar estado
    STATUS=$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null)
    
    if [ "$STATUS" = "true" ]; then
        echo "   ✅ Estado: CORRIENDO"
        
        # Verificar si responde en puerto 8090
        echo ""
        echo "3️⃣ Verificando acceso en puerto 8090..."
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/swagger/index.html)
        
        if [ "$RESPONSE" = "200" ]; then
            echo "   ✅ ICD API ACCESIBLE en http://localhost:8090"
        else
            echo "   ⚠️  Respuesta HTTP: $RESPONSE"
            echo "   Intentando acceso a /api/..."
            RESPONSE2=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/api/)
            echo "   Respuesta: $RESPONSE2"
        fi
    else
        echo "   ❌ Estado: PARADO"
        echo ""
        echo "   Para iniciar el contenedor:"
        echo "   docker start $CONTAINER_NAME"
    fi
fi

echo ""
echo "4️⃣ Buscando docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    echo "   ✅ docker-compose.yml encontrado"
    
    if grep -q "icd\|8090" docker-compose.yml; then
        echo "   ✅ Configuración ICD presente"
        echo ""
        echo "   Para iniciar todos los servicios:"
        echo "   docker-compose up -d"
    fi
else
    echo "   ℹ️  docker-compose.yml no encontrado"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════════╗"
echo "║                            FIN DEL DIAGNÓSTICO                                 ║"
echo "╚════════════════════════════════════════════════════════════════════════════════╝"
