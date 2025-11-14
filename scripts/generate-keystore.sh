#!/bin/bash
# Script para generar el keystore de release para Android
# Linux/Mac Bash Script

echo "========================================"
echo "Generador de Keystore para Clean&Fresh"
echo "========================================"
echo ""

cd android/app

echo "Ingresa los siguientes datos para generar el keystore:"
echo ""
read -sp "Contraseña del keystore (guarda esta contraseña!): " KEYSTORE_PASSWORD
echo ""
read -sp "Contraseña del alias/key (guarda esta contraseña!): " KEY_PASSWORD
echo ""

echo "Generando keystore..."
keytool -genkeypair -v -storetype PKCS12 -keystore cleanfresh-release.keystore -alias cleanfresh-key -keyalg RSA -keysize 2048 -validity 10000 -storepass "$KEYSTORE_PASSWORD" -keypass "$KEY_PASSWORD"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "¡Keystore generado exitosamente!"
    echo "========================================"
    echo ""
    echo "IMPORTANTE: Ahora actualiza android/gradle.properties con:"
    echo "  CLEANFRESH_RELEASE_STORE_PASSWORD=$KEYSTORE_PASSWORD"
    echo "  CLEANFRESH_RELEASE_KEY_PASSWORD=$KEY_PASSWORD"
    echo ""
    echo "Guarda estas contraseñas en un lugar seguro!"
    echo "Si las pierdes, no podrás actualizar la app en Play Store."
    echo ""
else
    echo ""
    echo "ERROR: No se pudo generar el keystore."
    echo "Verifica que tengas Java JDK instalado y que keytool esté en el PATH."
    echo ""
fi

cd ../..


