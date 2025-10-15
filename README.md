# 📱 LAVCONAR - Aplicación Móvil de Lavandería

Aplicación React Native para gestión de lavandería con escaneo RFID, gestión de clientes y guías de lavado para dispositivo C72.

## 🚀 Stack Tecnológico

- **React Native 0.74.5**
- **React 18.2.0**
- **TypeScript 5.0.4**
- **NativeWind v2.0.11** - Tailwind CSS para React Native
- **React Navigation v6** - Navegación
- **Zustand 4.5.2** - Estado global
- **TanStack Query 5.90.2** - Gestión de datos y caché
- **Axios** - Peticiones HTTP
- **AsyncStorage** - Persistencia local
- **Kotlin** - Módulo nativo RFID

## 📋 Inicio Rápido

### 1. Instalación

```bash
cd Frontend-LAVCONAR_APP-Laundry
npm install
```

### 2. Configurar Módulo RFID

Coloca el archivo `DeviceAPI_ver20250209_release.aar` en:
```
android/app/libs/DeviceAPI_ver20250209_release.aar
```

### 3. Ejecutar en Dispositivo C72

```bash
# Iniciar Metro Bundler
npm start

# En otra terminal, compilar e instalar
npm run android
```

📖 **[Ver Guía Completa de Instalación en C72](INSTALACION_C72.md)**

## 👤 Usuario Demo

Para probar la aplicación sin conexión al backend:

- **Usuario:** `admin` o `admin1@lavconar.com`
- **Contraseña:** Cualquier contraseña
- **Sucursal:** Selecciona cualquiera

## 🏗️ Estructura del Proyecto (Organización Modular)

```
src/
├── auth/                      # Módulo de autenticación
│   ├── actions/              # Acciones de autenticación
│   ├── api/                  # Servicios API de auth
│   ├── hooks/                # Hooks de auth
│   ├── interfaces/           # Interfaces de auth
│   ├── layouts/              # Layouts de auth
│   ├── pages/                # Pantallas de auth
│   └── store/                # Store de auth (Zustand)
│
├── laundry/                   # Módulo principal de lavandería
│   ├── actions/              # Acciones del negocio
│   │   ├── clients/
│   │   ├── guides/
│   │   └── tags/
│   ├── api/                  # Servicios API
│   │   ├── clients/
│   │   ├── guides/
│   │   └── tags/
│   ├── hooks/                # Hooks de negocio (React Query)
│   ├── interfaces/           # Interfaces del dominio
│   ├── layouts/              # Layouts del módulo
│   ├── pages/                # Pantallas del módulo
│   │   ├── clients/
│   │   ├── dashboard/
│   │   ├── guides/
│   │   └── scan/
│   └── store/                # Stores del módulo (Zustand)
│
├── components/               # Componentes compartidos
│   ├── common/              # Componentes básicos
│   └── ui/                  # Componentes UI
│
├── helpers/                 # Funciones helper
├── interfaces/              # Interfaces globales
├── lib/                     # Librerías y utilidades
│   └── rfid/               # Módulo RFID nativo
├── navigation/              # Configuración de navegación
└── constants/              # Constantes

android/                      # Configuración Android
├── app/
│   ├── libs/               # Módulo RFID (.aar)
│   └── src/main/
│       └── java/com/lavanderiaapp/
│           └── rfid/       # Bridge nativo RFID
└── README.md              # Documentación Android
```

## 🎯 Funcionalidades Principales

### ✅ Implementadas

1. **Autenticación**
   - Login con usuario/contraseña y sucursal
   - Persistencia de sesión
   - Modo demo funcional

2. **Dashboard**
   - Resumen de guías del día
   - Estadísticas en tiempo real
   - Acceso rápido a funciones

3. **Gestión de Clientes**
   - Registro de nuevos clientes
   - Validación en tiempo real

4. **Creación de Guías**
   - Selección de cliente
   - Escaneo de prendas con RFID
   - Asignación de procesos

5. **Escaneo RFID**
   - Escaneo continuo de tags
   - Asignación de procesos
   - Modo simulación para desarrollo

## 📱 Módulo RFID Nativo

### Integración

El módulo RFID está integrado en Kotlin:

- **`RFIDModule.kt`**: Bridge React Native ↔ SDK nativo
- **`RFIDPackage.kt`**: Registra el módulo
- **Archivo .aar**: SDK del dispositivo C72

### Uso en JavaScript

```typescript
import { rfidModule } from '@/lib/rfid/rfid.module';

// Iniciar escaneo
await rfidModule.startScan();

// Escuchar tags
const subscription = rfidModule.addTagListener((tag) => {
  console.log('EPC:', tag.epc);
});
```

📖 **[Ver Documentación del Módulo RFID](android/app/libs/README.md)**

## 🔌 Integración con API

### Configuración de URL Base

Editar `src/constants/index.ts`:

```typescript
export const API_BASE_URL = 'https://tu-api.com';
```

## 🏛️ Arquitectura

### Patrón Modular

La aplicación sigue una arquitectura modular similar al proyecto web:

- **Módulos independientes**: `auth/` y `laundry/`
- **Separación de responsabilidades**: actions, api, hooks, interfaces, pages, store
- **Componentes compartidos**: `components/common/` y `components/ui/`

### Gestión de Estado

- **Zustand**: Estado global y persistencia
- **TanStack Query**: Caché y sincronización con servidor

## 📦 Scripts Disponibles

```bash
npm start              # Iniciar Metro Bundler
npm run android        # Ejecutar en Android
npm run lint          # Ejecutar ESLint
cd android && ./gradlew assembleDebug    # Generar APK debug
cd android && ./gradlew assembleRelease  # Generar APK release
```

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Limpiar caché
npx react-native start --reset-cache

# Limpiar y recompilar
cd android
./gradlew clean
cd ..
npm run android
```

### Debugging

```bash
# Ver logs
adb logcat | grep "RFIDModule"

# Desinstalar app
adb uninstall com.lavanderiaapp

# Reinstalar
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 🐛 Solución de Problemas

### Error de compilación

```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
```

### Dispositivo no detectado

```bash
adb kill-server
adb start-server
adb devices
```

### Problemas con NativeWind

Verificar que `babel.config.js` incluya:
```javascript
plugins: ['nativewind/babel']
```

## 📚 Documentación Adicional

- **[Guía de Instalación en C72](INSTALACION_C72.md)** - Configuración completa del dispositivo
- **[Configuración Android](android/README.md)** - Detalles de la configuración Android
- **[Módulo RFID](android/app/libs/README.md)** - Integración del SDK RFID
- **[Guía de Desarrollo](DEVELOPMENT_GUIDE.md)** - Especificaciones técnicas completas

## 🔒 Seguridad

- Tokens JWT en AsyncStorage
- Interceptores Axios
- Validación de datos
- Manejo de errores centralizado

## 📝 Notas Importantes

1. **React Native 0.74.5** - NO usar versiones superiores
2. **NativeWind v2.0.11** - NO usar v4
3. **Módulo RFID** - Colocar `.aar` en `android/app/libs/`
4. **Arquitectura** - Seguir patrón modular del proyecto web

## 📄 Licencia

Proyecto privado - LAVCONAR

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025  
**Dispositivo:** C72 Android RFID Reader
