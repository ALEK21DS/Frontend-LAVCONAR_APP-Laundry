@echo off
REM Script para generar el keystore de release para Android
REM Windows Batch Script

echo ========================================
echo Generador de Keystore para Clean^&Fresh
echo ========================================
echo.

cd android\app

echo Ingresa los siguientes datos para generar el keystore:
echo.
set /p KEYSTORE_PASSWORD="Contraseña del keystore (guarda esta contraseña!): "
set /p KEY_PASSWORD="Contraseña del alias/key (guarda esta contraseña!): "
echo.

echo Generando keystore...
keytool -genkeypair -v -storetype PKCS12 -keystore cleanfresh-release.keystore -alias cleanfresh-key -keyalg RSA -keysize 2048 -validity 10000 -storepass "%KEYSTORE_PASSWORD%" -keypass "%KEY_PASSWORD%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ¡Keystore generado exitosamente!
    echo ========================================
    echo.
    echo IMPORTANTE: Ahora actualiza android/gradle.properties con:
    echo   CLEANFRESH_RELEASE_STORE_PASSWORD=%KEYSTORE_PASSWORD%
    echo   CLEANFRESH_RELEASE_KEY_PASSWORD=%KEY_PASSWORD%
    echo.
    echo Guarda estas contraseñas en un lugar seguro!
    echo Si las pierdes, no podras actualizar la app en Play Store.
    echo.
) else (
    echo.
    echo ERROR: No se pudo generar el keystore.
    echo Verifica que tengas Java JDK instalado y que keytool este en el PATH.
    echo.
)

cd ..\..

pause


