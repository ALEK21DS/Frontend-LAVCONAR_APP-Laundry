# 📱 Guía de Instalación en Dispositivo C72

Esta guía te ayudará a compilar e instalar la aplicación LAVCONAR en el dispositivo C72.

## 🔧 Pre-requisitos

### Software Necesario

1. **Node.js** >= 18
   ```bash
   node --version
   ```

2. **Java JDK 17**
   ```bash
   java -version
   ```

3. **Android Studio** con:
   - Android SDK Platform 34
   - Android Build Tools 34.0.0
   - Android SDK Tools
   - Android Emulator (opcional)

4. **Herramientas de línea de comandos**
   - ADB (Android Debug Bridge)
   ```bash
   adb version
   ```

### Variables de Entorno

Verificar que estén configuradas:

```powershell
# Verificar JAVA_HOME
echo $env:JAVA_HOME

# Verificar ANDROID_HOME
echo $env:ANDROID_HOME

# Verificar ADB
adb version
```

Si alguna no está configurada, abre PowerShell como Administrador y ejecuta:

```powershell
# ANDROID_HOME (ajustar ruta según tu instalación)
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Luego reinicia PowerShell
```

## 📦 Instalación del Proyecto

### 1. Instalar Dependencias

```bash
cd Frontend-LAVCONAR_APP-Laundry
npm install
```

### 2. Colocar el Módulo RFID

Copia el archivo `DeviceAPI_ver20250209_release.aar` en:
```
android/app/libs/DeviceAPI_ver20250209_release.aar
```

### 3. Generar el Keystore (Primera vez)

```bash
cd android/app
keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
```

## 🏃 Ejecutar en Modo Desarrollo

### 1. Preparar el Dispositivo C72

1. **Habilitar Modo Desarrollador:**
   - Ve a Ajustes > Acerca del teléfono
   - Toca 7 veces en "Número de compilación"

2. **Habilitar Depuración USB:**
   - Ve a Ajustes > Opciones de desarrollador
   - Activa "Depuración USB"

3. **Conectar por USB:**
   - Conecta el C72 a tu PC
   - Acepta la autorización de depuración USB en el dispositivo

4. **Verificar Conexión:**
   ```bash
   adb devices
   ```
   Deberías ver tu dispositivo listado.

### 2. Iniciar Metro Bundler

En una terminal:
```bash
npm start
```

### 3. Compilar e Instalar

En otra terminal:
```bash
npm run android
```

La aplicación se compilará e instalará automáticamente en el C72.

## 📦 Generar APK de Producción

### APK Debug (para pruebas)

```bash
cd android
./gradlew assembleDebug
```

El APK se generará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### APK Release (para producción)

1. **Crear keystore de producción:**
   ```bash
   keytool -genkey -v -keystore lavconar-release.keystore -alias lavconar -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configurar en `android/app/build.gradle`:**
   ```gradle
   signingConfigs {
       release {
           storeFile file('lavconar-release.keystore')
           storePassword 'TU_PASSWORD'
           keyAlias 'lavconar'
           keyPassword 'TU_PASSWORD'
       }
   }
   ```

3. **Generar APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

El APK se generará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔧 Instalación Manual del APK

Si quieres instalar el APK directamente:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

O para actualizar:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 🐛 Solución de Problemas

### Error: "SDK location not found"

Crea `android/local.properties`:
```properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Error: "Execution failed for task ':app:installDebug'"

```bash
# Desinstalar app anterior
adb uninstall com.lavanderiaapp

# Limpiar y recompilar
cd android
./gradlew clean
./gradlew assembleDebug
```

### Error de compilación de Gradle

```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
```

### El dispositivo no se detecta

```bash
# Reiniciar servidor ADB
adb kill-server
adb start-server
adb devices
```

### Error de permisos en Windows

Ejecutar PowerShell como Administrador.

## 📝 Verificar Instalación

Una vez instalada la app:

1. Abre la app en el C72
2. Deberías ver la pantalla de login
3. Usa las credenciales demo:
   - Usuario: `admin` o `admin1@lavconar.com`
   - Contraseña: Cualquiera
   - Sucursal: Cualquiera

## 🔍 Ver Logs en Tiempo Real

```bash
# Ver todos los logs
adb logcat

# Filtrar solo logs de React Native
adb logcat *:S ReactNative:V ReactNativeJS:V

# Filtrar logs de RFID
adb logcat | grep "RFIDModule"
```

## 📊 Monitorear Performance

```bash
# Ver uso de memoria
adb shell dumpsys meminfo com.lavanderiaapp

# Ver uso de CPU
adb shell top | grep lavanderiaapp
```

## 🔄 Actualizar la App

Para actualizar después de cambios en el código:

1. **Hot Reload (cambios en JS):**
   - Presiona `R` dos veces en el dispositivo
   - O sacude el dispositivo y selecciona "Reload"

2. **Recompilar (cambios en código nativo):**
   ```bash
   npm run android
   ```

## 📚 Recursos Adicionales

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Android Developer Guide](https://developer.android.com/guide)
- [Debugging React Native](https://reactnative.dev/docs/debugging)

## ✅ Checklist de Instalación

- [ ] Node.js instalado
- [ ] JDK 17 instalado
- [ ] Android Studio configurado
- [ ] Variables de entorno configuradas
- [ ] Dependencias npm instaladas
- [ ] Módulo RFID (.aar) colocado
- [ ] Keystore generado
- [ ] Dispositivo C72 en modo desarrollador
- [ ] Depuración USB habilitada
- [ ] Dispositivo detectado por ADB
- [ ] App compilada exitosamente
- [ ] App instalada en C72
- [ ] App funciona correctamente

---

**¿Problemas?** Revisa la sección de Solución de Problemas o consulta los logs con `adb logcat`.

