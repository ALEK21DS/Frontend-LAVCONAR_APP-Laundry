# Configuración de Android para LAVCONAR App

## 📦 Módulo RFID Nativo

El archivo `DeviceAPI_ver20250209_release.aar` debe colocarse en:
```
android/app/libs/DeviceAPI_ver20250209_release.aar
```

## 🔧 Configuración del Módulo RFID

El módulo RFID ya está configurado en:
- **RFIDModule.kt**: Módulo nativo que expone funciones al JavaScript
- **RFIDPackage.kt**: Package que registra el módulo
- **MainApplication.kt**: Incluye el RFIDPackage

### Métodos Disponibles

El módulo expone los siguientes métodos a React Native:

```kotlin
- startScan(): Inicia el escaneo RFID
- stopScan(): Detiene el escaneo RFID
- isScanning(): Verifica si está escaneando
- getPower(): Obtiene la potencia actual
- setPower(power): Establece la potencia (0-30)
```

### Eventos Emitidos

```kotlin
- onTagScanned: Se emite cuando se escanea un tag
  { epc: string, rssi: number, timestamp: number }

- onScanError: Se emite cuando hay un error
  { message: string }
```

## 🔗 Integración con DeviceAPI

Los métodos en `RFIDModule.kt` tienen comentarios `// TODO:` que indican dónde integrar las llamadas al módulo nativo `DeviceAPI_ver20250209_release.aar`.

Ejemplo de integración:

```kotlin
// En RFIDModule.kt, método startScan:
import com.deviceapi.RFIDReader // Importar del .aar

private val rfidReader = RFIDReader.getInstance()

@ReactMethod
fun startScan(promise: Promise) {
    try {
        rfidReader.startInventory() // Llamar método del .aar
        isScanning = true
        promise.resolve(null)
    } catch (e: Exception) {
        promise.reject("RFID_ERROR", e.message, e)
    }
}
```

## 🏃 Compilar y Ejecutar

1. **Limpiar y compilar:**
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

2. **Ejecutar en dispositivo:**
```bash
npm run android
```

3. **Generar APK de release:**
```bash
cd android
./gradlew assembleRelease
```

El APK se generará en: `android/app/build/outputs/apk/release/`

## 📱 Dispositivo C72

Para el dispositivo C72, asegúrate de:

1. Habilitar modo desarrollador en el dispositivo
2. Habilitar depuración USB
3. Conectar el dispositivo por USB
4. Verificar conexión: `adb devices`
5. Ejecutar: `npm run android`

## 🔐 Keystore

Para compilaciones de producción, genera un keystore real:

```bash
keytool -genkey -v -keystore lavconar-release.keystore -alias lavconar -keyalg RSA -keysize 2048 -validity 10000
```

Luego actualiza `android/app/build.gradle` con la configuración de firma.

