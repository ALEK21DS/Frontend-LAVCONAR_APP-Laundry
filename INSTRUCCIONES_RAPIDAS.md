# 🚀 Instrucciones Rápidas - LAVCONAR C72

## ✅ Checklist de Configuración

### 1. Verificar Herramientas (Primera vez)

```powershell
# Verificar Java
java -version

# Verificar ADB
adb version
```

Si `adb version` no funciona, configura ANDROID_HOME:
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
# Luego reinicia PowerShell
```

### 2. Instalar Dependencias NPM
```bash
cd Frontend-LAVCONAR_APP-Laundry
npm install
```

### 3. Colocar el Módulo RFID
📦 Copiar el archivo `DeviceAPI_ver20250209_release.aar` en:
```
android/app/libs/DeviceAPI_ver20250209_release.aar
```

### 4. Preparar el Dispositivo C72

✅ Configurar dispositivo:
- Habilitar **Modo Desarrollador** (tocar 7 veces en Número de compilación)
- Habilitar **Depuración USB** en Opciones de desarrollador
- Conectar por USB a la PC
- Aceptar autorización de depuración USB

✅ Verificar conexión:
```bash
adb devices
```
Debe aparecer el dispositivo listado.

### 4. Ejecutar la Aplicación

🔹 **Opción 1: Modo Desarrollo (Recomendado)**

Terminal 1:
```bash
npm start
```

Terminal 2:
```bash
npm run android
```

🔹 **Opción 2: Solo Compilar e Instalar**
```bash
npm run android
```

## 📱 Probar la Aplicación

Una vez instalada:

1. Abrir **LAVCONAR App** en el C72
2. Usar credenciales demo:
   - **Usuario:** `admin` o `admin1@lavconar.com`
   - **Contraseña:** cualquiera
   - **Sucursal:** cualquiera

3. Navegar por las funciones:
   - ✅ Dashboard
   - ✅ Registrar Cliente
   - ✅ Crear Guía
   - ✅ Escanear Prendas (modo simulación)

## 🐛 Soluciones Rápidas

### Error: "Dispositivo no detectado"
```bash
adb kill-server
adb start-server
adb devices
```

### Error: "App ya existe"
```bash
adb uninstall com.lavanderiaapp
npm run android
```

### Error de compilación
```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
npm run android
```

### Limpiar todo y empezar de nuevo
```bash
# Limpiar node_modules
rm -rf node_modules
npm install

# Limpiar Android
cd android
./gradlew clean
cd ..

# Limpiar Metro
npx react-native start --reset-cache
```

## 📦 Generar APK para Distribución

### APK Debug (pruebas)
```bash
cd android
./gradlew assembleDebug
```
APK en: `android/app/build/outputs/apk/debug/app-debug.apk`

### APK Release (producción)
```bash
cd android
./gradlew assembleRelease
```
APK en: `android/app/build/outputs/apk/release/app-release.apk`

## 🔍 Ver Logs en Tiempo Real

```bash
# Todos los logs
adb logcat

# Solo React Native
adb logcat *:S ReactNative:V ReactNativeJS:V

# Solo RFID
adb logcat | grep "RFIDModule"
```

## 📚 Documentación Completa

- 📖 **[Instalación Detallada](INSTALACION_C72.md)** - Guía completa paso a paso
- 🔧 **[Configuración Android](android/README.md)** - Detalles técnicos
- 📡 **[Módulo RFID](android/app/libs/README.md)** - Integración del SDK
- 💻 **[Desarrollo](DEVELOPMENT_GUIDE.md)** - Especificaciones técnicas

## ⚡ Atajos Útiles

```bash
# Reiniciar Metro
r + Enter

# Reload en dispositivo
Sacudir el C72 > Reload
```

## 🎯 Siguiente Paso

Una vez funcionando en modo desarrollo, integra el módulo RFID real:

1. Revisa `android/app/src/main/java/com/lavanderiaapp/rfid/RFIDModule.kt`
2. Busca los comentarios `// TODO:`
3. Implementa las llamadas al SDK del `.aar`
4. Compila y prueba

---

**¿Problemas?** Revisa la documentación completa o los logs con `adb logcat`

