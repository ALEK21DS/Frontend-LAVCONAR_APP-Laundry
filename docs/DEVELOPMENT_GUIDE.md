# 📱 LAVANDERÍA APP - GUÍA DE DESARROLLO

## 🎯 OBJETIVO
Crear una aplicación React Native para gestión de lavandería con las siguientes especificaciones técnicas.

---

## 📋 STACK TECNOLÓGICO OBLIGATORIO

### Core
- **React Native 0.74.5** (⚠️ NO usar versiones superiores)
- **React 18.2.0**
- **TypeScript 5.0.4**
- **NativeWind v2.0.11** (para Tailwind CSS en React Native)
- **TailwindCSS 3.3.2**

### Navegación
- `@react-navigation/native ^6.1.9`
- `@react-navigation/native-stack ^6.9.17`
- `react-native-screens ^3.31.1`
- `react-native-safe-area-context ^4.10.5`

### Estado y Datos
- **Zustand ^4.5.2** - Para manejo de estado global
- **@tanstack/react-query ^5.90.2** - Para manejo de APIs (fetching, caching, sincronización)
- `@react-native-async-storage/async-storage ^1.23.1` - Para persistencia

### UI/UX
- `react-native-vector-icons ^10.0.3` - Para iconos
- **Axios** - Para peticiones HTTP

### Módulo Nativo
- Módulo RFID Android personalizado (`DeviceAPI_ver20250209_release.aar`) ya integrado en `android/app/libs/`

---

## 🏗️ ARQUITECTURA MODULAR

```
src/
├── components/          # Componentes reutilizables
│   ├── common/         # Botones, inputs, cards, dropdowns
│   ├── layout/         # Containers, layouts
│   └── forms/          # Formularios específicos
│
├── screens/            # Pantallas de la app
│   ├── auth/          # Login, registro
│   ├── dashboard/     # Dashboard principal
│   ├── clients/       # Gestión de clientes
│   ├── guides/        # Creación y gestión de guías
│   └── scan/          # Escaneo RFID
│
├── navigation/         # Configuración de navegación
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
│
├── store/             # Zustand stores
│   ├── authStore.ts
│   ├── clientStore.ts
│   ├── guideStore.ts
│   └── tagStore.ts
│
├── services/          # Servicios para APIs
│   ├── api/
│   │   ├── axiosConfig.ts      # Configuración base de Axios
│   │   ├── authService.ts      # Endpoints de autenticación
│   │   ├── clientService.ts    # Endpoints de clientes
│   │   ├── guideService.ts     # Endpoints de guías
│   │   └── rfidService.ts      # Endpoints RFID
│   └── rfid/
│       └── rfidModule.ts       # Bridge al módulo nativo RFID
│
├── hooks/             # React Query hooks personalizados
│   ├── useAuth.ts
│   ├── useClients.ts
│   ├── useGuides.ts
│   └── useTags.ts
│
├── types/             # TypeScript types/interfaces
│   ├── auth.types.ts
│   ├── client.types.ts
│   ├── guide.types.ts
│   └── tag.types.ts
│
├── constants/         # Constantes
│   ├── colors.ts
│   ├── processes.ts
│   └── sucursales.ts
│
└── utils/            # Utilidades
    ├── validators.ts
    └── formatters.ts
```

---

## 🔑 REGLAS DE DISEÑO Y UX

1. **Botones de Acción Modal**: Solo iconos, sin texto
   - Cerrar: ❌
   - Aceptar: ✅
   - Rechazar: ❌

2. **Formularios**: Siempre en pantallas nuevas, NO en modales ni incrustados

3. **Botón de Logout**: Usar el mismo componente en todas las pantallas

4. **Diseño**: Moderno, limpio, con buenas prácticas de UX

---

## 🔌 API REST - ENDPOINTS

**Base URL:** `https://api.lavanderia.com` (configurar en variable de entorno)

### Autenticación
```typescript
POST /api/auth/login
Body: { 
  username: string, 
  password: string, 
  sucursalId: string 
}
Response: { 
  token: string, 
  user: User 
}

POST /api/auth/logout
Headers: { 
  Authorization: "Bearer {token}" 
}
```

### Clientes
```typescript
GET /api/clients
Response: Client[]

GET /api/clients/:id
Response: Client

POST /api/clients
Body: { 
  nombre: string, 
  telefono: string, 
  email?: string, 
  direccion?: string 
}
Response: Client

PUT /api/clients/:id
Body: Partial<Client>
Response: Client

DELETE /api/clients/:id
Response: { success: boolean }
```

### Guías de Lavandería
```typescript
GET /api/guides
Response: Guide[]

GET /api/guides/:id
Response: Guide

POST /api/guides
Body: {
  clientId: string,
  sucursalId: string,
  items: Array<{
    tagEPC: string,
    proceso: string,
    descripcion?: string
  }>
}
Response: Guide

PUT /api/guides/:id/status
Body: { 
  status: 'pendiente' | 'proceso' | 'terminado' | 'entregado' 
}
Response: Guide
```

### Tags RFID
```typescript
GET /api/tags
Response: Tag[]

GET /api/tags/:epc
Response: Tag

POST /api/tags/register
Body: { 
  epc: string, 
  clientId: string, 
  proceso: string 
}
Response: Tag

PUT /api/tags/:epc
Body: Partial<Tag>
Response: Tag

DELETE /api/tags/:epc
Response: { success: boolean }
```

---

## 📱 FUNCIONALIDADES PRINCIPALES

### 1. Autenticación
- Login con usuario/contraseña y selección de sucursal
- Persistencia de sesión con AsyncStorage + Zustand
- **Usuario demo**: `admin` o `admin1@lavconar.com` con cualquier contraseña

### 2. Registro de Clientes (RegisterClientScreen)
- Formulario en pantalla nueva con campos:
  - Nombre (requerido)
  - Teléfono (requerido)
  - Email (opcional)
  - Dirección (opcional)
- Validación en tiempo real
- Usar TanStack Query mutation para POST

### 3. Creación de Guías (CreateGuideScreen)
- Seleccionar cliente (dropdown con búsqueda)
- Escanear prendas con RFID
- Asignar proceso a cada prenda (dropdown)
- Lista en tiempo real de prendas escaneadas
- Guardar guía completa
- Usar TanStack Query mutations

### 4. Escaneo RFID
- **ScanClothesScreen**: Escaneo continuo de prendas
- **ScanProcessesScreen**: Asignar procesos a tags
- Integración con módulo nativo `DeviceAPI_ver20250209_release.aar`
- Feedback visual y auditivo al escanear

### 5. Dashboard
- Resumen de guías del día
- Guías pendientes, en proceso, terminadas
- Acceso rápido a funciones principales
- Usar TanStack Query para fetch y cache

---

## 🔧 CONFIGURACIONES IMPORTANTES

### babel.config.js
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['nativewind/babel'],
};
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#60A5FA',
        },
      },
    },
  },
  plugins: [],
};
```

### App.tsx - TanStack Query Provider
```typescript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
    </QueryClientProvider>
  );
}
```

### Zustand con Persist (ejemplo)
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (username, password) => {
        // Lógica de login
        set({ user: userData, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### React Query Hook (ejemplo)
```typescript
// hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/api/clientService';

export const useClients = () => {
  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  const createClient = useMutation({
    mutationFn: clientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateClient = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => 
      clientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteClient = useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return { 
    clients, 
    isLoading, 
    error,
    createClient, 
    updateClient, 
    deleteClient 
  };
};
```

### Axios Configuration (ejemplo)
```typescript
// services/api/axiosConfig.ts
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const API_BASE_URL = 'https://api.lavanderia.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

---

## ⚠️ RESTRICCIONES Y CONSIDERACIONES

### ❌ NO HACER
1. **NO usar React Native 0.76+** (incompatible con NativeWind v2)
2. **NO usar NativeWind v4** (solo v2.0.11)
3. **NO crear archivos `global.css` ni `postcss.config.js`** (no son necesarios en NativeWind v2)
4. **NO usar StyleSheet nativo** (usar `className` de NativeWind)

### ✅ SÍ HACER
1. **Manejo de APIs OBLIGATORIO con TanStack Query + Zustand**
   - **TanStack Query**: fetching, caching, mutaciones, sincronización con servidor
   - **Zustand**: estado global, persistencia local, lógica de negocio
2. **Usar `className` de NativeWind** para todos los estilos
3. Todos los componentes con **TypeScript estricto**
4. Integración con módulo RFID nativo Android ya presente en el proyecto
5. Validación de formularios en tiempo real
6. Manejo de errores con feedback visual al usuario

---

## 📦 DEPENDENCIAS INSTALADAS

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.23.1",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@tanstack/react-query": "^5.90.2",
    "nativewind": "^2.0.11",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "^4.10.5",
    "react-native-screens": "^3.31.1",
    "react-native-vector-icons": "^10.0.3",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/babel-preset": "0.74.87",
    "@react-native/eslint-config": "0.74.87",
    "@react-native/metro-config": "0.74.87",
    "@react-native/typescript-config": "0.74.87",
    "@types/react": "^18.2.6",
    "@types/react-native-vector-icons": "^6.4.18",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.6.3",
    "eslint": "^8.19.0",
    "jest": "^29.6.3",
    "prettier": "2.8.8",
    "react-test-renderer": "18.2.0",
    "tailwindcss": "3.3.2",
    "typescript": "5.0.4"
  }
}
```

---

## 🚀 COMANDOS ÚTILES

### Instalación
```bash
npm install
```

### Ejecutar en Android
```bash
npm run android
```

### Limpiar caché
```bash
npx react-native start --reset-cache
```

### Limpiar Gradle (si hay problemas)
```bash
cd android
.\gradlew clean
cd ..
```

### Desinstalar app del dispositivo
```bash
adb uninstall com.lavanderiaapp
```

---

## 📝 ESTADO ACTUAL DEL PROYECTO

### ✅ Completado
- Configuración base de React Native 0.74.5
- NativeWind v2 configurado y funcionando
- Navegación básica (Auth y Main)
- Login screen funcional con estilos
- AuthStore con Zustand + persist
- Componentes comunes (Button, Input, Dropdown, Card, Container)
- Constantes (colores, procesos, sucursales)
- Módulo RFID nativo integrado

### 🔨 Por Implementar
1. **Servicios de API** (`src/services/api/`)
   - axiosConfig.ts
   - authService.ts
   - clientService.ts
   - guideService.ts
   - rfidService.ts

2. **Hooks de React Query** (`src/hooks/`)
   - useAuth.ts
   - useClients.ts
   - useGuides.ts
   - useTags.ts

3. **Stores adicionales** (`src/store/`)
   - clientStore.ts
   - guideStore.ts
   - tagStore.ts (ya existe básico)

4. **Pantallas**
   - DashboardScreen (completa)
   - RegisterClientScreen (completa)
   - CreateGuideScreen (completa)
   - ScanClothesScreen (integrar RFID)
   - ScanProcessesScreen (integrar RFID)

5. **Tipos TypeScript** (`src/types/`)
   - guide.types.ts
   - Completar client.types.ts
   - Completar tag.types.ts

6. **Utilidades** (`src/utils/`)
   - validators.ts
   - formatters.ts

---

## 🎯 SIGUIENTE PASO INMEDIATO

Implementar la estructura modular completa con:

1. **Configurar Axios y servicios de API**
   - Crear `axiosConfig.ts` con interceptores
   - Crear servicios para cada entidad (auth, clients, guides, tags)

2. **Crear hooks de React Query**
   - `useClients` para CRUD de clientes
   - `useGuides` para gestión de guías
   - `useTags` para RFID

3. **Implementar pantallas faltantes**
   - Dashboard con métricas en tiempo real
   - Registro de clientes con validación
   - Creación de guías con escaneo RFID

4. **Integrar módulo RFID nativo**
   - Bridge TypeScript para DeviceAPI
   - Implementar escaneo continuo
   - Feedback visual/auditivo

---

## 📚 RECURSOS

- [React Native 0.74 Docs](https://reactnative.dev/docs/0.74/getting-started)
- [NativeWind v2 Docs](https://www.nativewind.dev/v2/overview)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [React Navigation v6 Docs](https://reactnavigation.org/docs/6.x/getting-started)

---

**NOTA FINAL**: El proyecto YA está configurado con RN 0.74.5 + NativeWind v2. Solo falta implementar la arquitectura modular, los servicios de API con TanStack Query, y las pantallas funcionales. **TODO el manejo de datos debe ser con TanStack Query (fetching/caching) y Zustand (estado global/persistencia).**

