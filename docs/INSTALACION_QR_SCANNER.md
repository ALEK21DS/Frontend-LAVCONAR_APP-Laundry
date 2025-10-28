# 📷 Instalación del Escáner QR Real

Este documento explica cómo configurar el escáner QR real para el dispositivo C72.

## 📦 Librerías Instaladas

- **react-native-camera**: ^4.2.1 (librería estable y probada para escaneo de QR y barcodes)

**Nota**: Inicialmente se intentó usar `react-native-vision-camera`, pero presentaba problemas con rutas largas en Windows (límite de 250 caracteres de CMake). `react-native-camera` es más compatible con el dispositivo C72 y no tiene estos problemas.

## ⚙️ Configuración Realizada

### 1. Android Manifest
El permiso de cámara ya está configurado en `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### 2. Gradle Configuration
Se agregaron las configuraciones necesarias en:
- `android/settings.gradle`: Inclusión del módulo react-native-camera
- `android/app/build.gradle`: 
  - Dependencia del proyecto react-native-camera
  - `missingDimensionStrategy 'react-native-camera', 'general'` (para usar la variante sin ML Kit)

## 🔨 Pasos para Reconstruir la App

### 1. Limpiar el caché y node_modules (Opcional pero recomendado)
```bash
cd Frontend-LAVCONAR_APP-Laundry
rm -rf node_modules
npm install
```

### 2. Limpiar build de Android
```bash
cd android
./gradlew clean
cd ..
```

### 3. Reconstruir la app
```bash
npx react-native run-android
```

## 🎯 Uso del Escáner QR

### Ubicación
El botón "Escanear Código QR" está disponible en:
1. **Página de Guías**: Botón verde con icono QR al lado del botón "+" en el header
2. **Modal de selección de guías**: Después de elegir tipo de servicio y proceso

### Flujo de Escaneo

#### En Página de Guías:
1. El usuario presiona el botón verde con icono QR (al lado del botón "+")
2. Se abre la cámara con una interfaz de escaneo
3. El usuario apunta la cámara al código QR de la guía
4. El escaneo se realiza automáticamente
5. Se muestra el modal de detalles de la guía (el mismo que al presionar una guía de la lista)
6. El usuario puede ver los detalles completos de la guía

#### En Modal de Selección de Guías (Procesos):
1. El usuario selecciona un tipo de servicio (personal/industrial)
2. El usuario selecciona un tipo de proceso (IN_PROCESS, WASHING, etc.)
3. Se muestra la lista de guías con el botón "Escanear Código QR"
4. Al presionar el botón, se abre el escáner
5. Después del escaneo, se muestran los detalles de la guía
6. El usuario puede continuar con el proceso o cancelar

### Componentes Creados
- **QrScanner.tsx**: Componente de escáner QR con cámara real
  - Utiliza `react-native-camera` (RNCamera) para acceso a la cámara y detección de QR
  - Interfaz con marco de escaneo y esquinas azules animadas
  - Botón de cerrar en la parte superior derecha
  - Instrucciones centradas en la parte inferior
  - Manejo automático de permisos de cámara con dialogo nativo de Android

## 🔐 Permisos

El componente maneja automáticamente:
- Verificación de permisos de cámara
- Solicitud de permisos si no están otorgados
- Redirección a configuración si los permisos fueron denegados

## 📝 Código del QR

El backend genera códigos QR para cada guía con la siguiente estructura:
```json
{
  "type": "guide",
  "id": "guide-uuid",
  "data": {
    "guideNumber": "G-2025-0001",
    "scannedAt": "2025-10-28T00:00:00.000Z"
  },
  "timestamp": "2025-10-28T00:00:00.000Z"
}
```

## 🐛 Solución de Problemas

### Error: Camera permission denied
- Verifica que el permiso de cámara esté en AndroidManifest.xml
- Ve a Configuración del dispositivo → Apps → LavanderiaApp → Permisos → Cámara → Permitir

### Error: Module not found 'react-native-camera'
```bash
cd Frontend-LAVCONAR_APP-Laundry
npm install react-native-camera@4.2.1
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Error: CMake path too long (solo si usas vision-camera)
Si ves errores relacionados con rutas demasiado largas como:
```
The object file directory [...] has 194 characters. The maximum full path to an object file is 250 characters
```
Este es un problema conocido de `react-native-vision-camera` en Windows. La solución es usar `react-native-camera` en su lugar (ya implementado en este proyecto).

### La cámara no se abre o aparece en negro
- Verifica que el dispositivo tenga una cámara trasera funcional
- Reinicia la aplicación
- Limpia el caché: `npx react-native start --reset-cache`

### Error al construir (Gradle)
```bash
cd android
./gradlew clean
./gradlew assembleDebug --stacktrace
```

## 📱 Compatibilidad

- ✅ Android 5.0 (API 21) o superior
- ✅ Cámara trasera requerida
- ✅ Optimizado para dispositivo C72

## 🎨 Interfaz del Escáner

El escáner QR tiene:
- Fondo oscuro semi-transparente
- Marco de escaneo cuadrado (250x250px) con esquinas azules animadas
- Botón de cerrar en la esquina superior derecha
- Icono y texto de instrucciones en la parte inferior
- Escaneo automático al detectar un QR válido

