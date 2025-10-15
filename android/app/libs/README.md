# Módulo RFID Nativo

## 📦 Instalación del archivo .aar

Coloca el archivo **`DeviceAPI_ver20250209_release.aar`** en esta carpeta:

```
android/app/libs/DeviceAPI_ver20250209_release.aar
```

## ✅ Verificación

El módulo ya está configurado en `android/app/build.gradle`:

```gradle
dependencies {
    // ...
    implementation files('libs/DeviceAPI_ver20250209_release.aar')
}
```

## 🔗 Integración

El módulo RFID está integrado en:

- **`RFIDModule.kt`**: Módulo nativo con métodos expuestos a React Native
- **`RFIDPackage.kt`**: Package que registra el módulo  
- **`MainApplication.kt`**: Aplicación que incluye el RFIDPackage

## 📝 Métodos Disponibles en JavaScript

```javascript
import { rfidModule } from '@/lib/rfid/rfid.module';

// Iniciar escaneo
await rfidModule.startScan();

// Detener escaneo  
await rfidModule.stopScan();

// Verificar si está escaneando
const scanning = await rfidModule.isScanning();

// Obtener potencia
const power = await rfidModule.getPower();

// Establecer potencia (0-30)
await rfidModule.setPower(26);

// Escuchar tags escaneados
const subscription = rfidModule.addTagListener((tag) => {
  console.log('Tag escaneado:', tag.epc);
});

// Limpiar listener
subscription.remove();
```

## 🔧 Próximos Pasos

Para integrar completamente el módulo RFID:

1. Coloca el archivo `.aar` en esta carpeta
2. Revisa la documentación del SDK del dispositivo C72
3. Actualiza `RFIDModule.kt` con las llamadas reales al SDK
4. Compila y prueba en el dispositivo

## 📚 Documentación del SDK

Consulta la documentación del archivo `DeviceAPI_ver20250209_release.aar` para conocer:

- Clases principales del SDK
- Métodos disponibles
- Callbacks y eventos
- Configuración específica del C72

