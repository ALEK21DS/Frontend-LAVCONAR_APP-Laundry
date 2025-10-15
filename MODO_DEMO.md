# 🎭 Modo Demo - Instrucciones

## ¿Qué es el Modo Demo?

El **Modo Demo** permite desarrollar y probar la aplicación **sin necesidad de tener el backend corriendo**. Usa datos simulados (mock) que imitan el comportamiento real del backend.

---

## 🔄 Cómo Cambiar Entre Modo Demo y Modo Real

### **Opción 1: Cambiar en los archivos API**

#### Para **Clientes**:
Archivo: `src/laundry/api/clients/clients.api.ts`

```typescript
// Modo demo: cambiar a true para usar datos mock sin backend
const USE_MOCK_DATA = true;  // ← Cambiar a false para modo real
```

#### Para **Guías**:
Archivo: `src/laundry/api/guides/guides.api.ts`

```typescript
// Modo demo: cambiar a true para usar datos mock sin backend
const USE_MOCK_DATA = true;  // ← Cambiar a false para modo real
```

#### Para **Autenticación**:
Archivo: `src/auth/pages/login/LoginPage.tsx` (línea 11)

```typescript
// MODO DEMO (sin backend):
const { loginDemo, isLoading, error, clearError } = useAuth();
await loginDemo(formData);

// MODO REAL (con backend):
const { login, isLoading, error, clearError } = useAuth();
await login(formData);
```

---

## 📊 Datos Mock Disponibles

### **Clientes (8 clientes demo):**
- Hotel Imperial Plaza
- Restaurante La Plaza Gourmet
- Clínica San José Medical Center
- Spa Wellness & Relax
- Hotel Plaza Suites & Spa
- Gimnasio FitLife Premium
- Corporación Textil Andina S.A.
- Universidad Técnica Nacional

### **Guías (5 guías demo):**
- G-2024-001 - Hotel Imperial (En Proceso)
- G-2024-002 - Restaurante (Completada)
- G-2024-003 - Clínica (Recolectada)
- G-2024-004 - Spa (Entregada)
- G-2024-005 - Hotel Plaza (En Tránsito)

### **Escaneo RFID:**
- Genera tags aleatorios cada 2 segundos
- Formato: `E280000000000000001234`
- Señal RSSI: entre -40 y -70 dBm

---

## ✅ Funcionalidades en Modo Demo

| Funcionalidad | ¿Funciona? | ¿Persiste? |
|---------------|------------|------------|
| Login | ✅ Sí | ❌ No (solo sesión) |
| Ver Clientes | ✅ Sí | - |
| Registrar Cliente | ✅ Sí | ❌ No (solo en memoria) |
| Ver Dashboard | ✅ Sí | - |
| Crear Guía | ✅ Sí | ❌ No (solo en memoria) |
| Escanear RFID | ✅ Sí | ❌ No (solo en memoria) |
| Navegación | ✅ Sí | - |

**Nota:** En modo demo, los datos creados **NO se guardan** al cerrar la app.

---

## 🔧 Para Modo Real (Con Backend)

### 1. Asegúrate de tener el backend corriendo:
```bash
cd Backend-LAVCONAR-Laundry
npm run start:dev
```

### 2. Configura la URL del backend:
Archivo: `src/constants/index.ts`

```typescript
export const API_BASE_URL = 'http://TU_IP:3000/api';
// Ejemplo: 'http://192.168.1.100:3000/api'
```

### 3. Cambia a modo real:
- `USE_MOCK_DATA = false` en las APIs
- Usa `login()` en lugar de `loginDemo()`

### 4. Reinicia la app:
```bash
npm start
npm run android
```

---

## 🎨 Diferencias Visuales

No hay diferencias visuales entre modo demo y modo real. La única diferencia es:

- **Demo:** Datos simulados en memoria
- **Real:** Datos del backend PostgreSQL

---

## 📝 Notas Importantes

1. **Usuario Demo:**
   - Usuario: `admin` o `admin1@lavconar.com`
   - Contraseña: cualquiera
   - Sucursal: cualquiera

2. **Datos Mock:**
   - Los clientes y guías mock están en `src/laundry/api/**/__mocks__/`
   - Puedes agregar más datos editando esos archivos

3. **Escaneo RFID:**
   - Siempre usa simulación (no requiere hardware C72)
   - Para usar C72 real, implementar en `src/lib/rfid/rfid.module.ts`

---

## 🚀 Recomendación

- **Desarrollo UI/UX:** Usa modo demo
- **Testing de integración:** Usa modo real
- **Producción:** Solo modo real

---

**Última actualización:** Octubre 2025

