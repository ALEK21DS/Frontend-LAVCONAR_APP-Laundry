# Integración Backend - Procesos de Lavado y Secado

## Resumen
Este documento describe la integración pendiente con el backend para los procesos de LAVADO y SECADO.

## Flujo Actual (Demo)

### LAVADO (WASHING)
1. Usuario selecciona "LAVADO" en el modal de procesos
2. Se muestran guías con estado `RECEIVED` o `IN_PROCESS`
3. Usuario selecciona una guía
4. **Modal de Confirmación**: "¿Estás seguro de que quieres cambiar el estado de la guía G-XXXX?"
5. Usuario confirma
6. **[PENDIENTE]** Llamada al backend para actualizar estado a `WASHING`
7. **Se regresa al Dashboard** (no se abre el escáner)
8. La guía ahora tiene estado `WASHING` y puede ser procesada en SECADO

### SECADO (DRYING)
1. Usuario selecciona "SECADO" en el modal de procesos
2. Se muestran guías con estado `WASHING`
3. Usuario selecciona una guía
4. **Modal de Confirmación**: "¿Estás seguro de que quieres cambiar el estado de la guía G-XXXX?"
5. Usuario confirma
6. **[PENDIENTE]** Llamada al backend para actualizar estado a `DRYING`
7. **Se regresa al Dashboard** (no se abre el escáner)
8. La guía ahora tiene estado `DRYING` y puede continuar en el flujo

### EMBARQUE (SHIPPING)
1. Usuario selecciona "EMBARQUE" en el modal de procesos
2. Se muestran guías con estado `PACKAGING`
3. Usuario selecciona una guía
4. **Modal de Confirmación**: "¿Estás seguro de que quieres cambiar el estado de la guía G-XXXX?"
5. Usuario confirma
6. **[PENDIENTE]** Llamada al backend para actualizar estado a `SHIPPING`
7. **Se regresa al Dashboard** (no se abre el escáner)
8. La guía ahora tiene estado `SHIPPING` y puede continuar en el flujo

## Integración con Backend

### Endpoint Requerido
```typescript
// PUT /api/guides/:id/status
// Body: { status: 'WASHING' | 'DRYING' | ... }
```

### Ubicación del Código
**Archivo**: `Frontend-LAVCONAR_APP-Laundry/src/components/layout/MainLayout.tsx`

**Función**: `handleConfirmStatusChange` (líneas 56-75)

```typescript
const handleConfirmStatusChange = async () => {
  setIsUpdatingStatus(true);
  
  // TODO: Aquí se hará la llamada al backend para actualizar el estado
  // Ejemplo:
  // try {
  //   await guidesApi.updateStatus(
  //     selectedGuideForConfirmation.id, 
  //     getNewStatusFromProcess(selectedProcessType)
  //   );
  // } catch (error) {
  //   Alert.alert('Error', 'No se pudo actualizar el estado de la guía');
  //   setIsUpdatingStatus(false);
  //   return;
  // }
  
  // Simular delay de red (REMOVER EN PRODUCCIÓN)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  setIsUpdatingStatus(false);
  setConfirmationModalOpen(false);
  
  // Regresar al Dashboard después de actualizar el estado
  onNavigate('Dashboard');
};
```

### API Service a Crear
**Archivo**: `Frontend-LAVCONAR_APP-Laundry/src/laundry/api/guides/guides.api.ts`

```typescript
export const guidesApi = {
  // ... métodos existentes
  
  // NUEVO: Actualizar solo el estado de una guía
  updateStatus: async (guideId: string, newStatus: string): Promise<void> => {
    const { data } = await apiClient.put(
      `/guides/${guideId}/status`,
      { status: newStatus }
    );
    return data;
  },
};
```

### Mapeo de Estados
```typescript
PROCESO         → ESTADO ACTUAL DE GUÍA → NUEVO ESTADO
---------------   ---------------------   -------------
IN_PROCESS      → RECEIVED               → IN_PROCESS
WASHING         → IN_PROCESS             → WASHING     ← Requiere confirmación
DRYING          → WASHING                → DRYING      ← Requiere confirmación
PACKAGING       → DRYING                 → PACKAGING
SHIPPING        → PACKAGING              → SHIPPING
LOADING         → SHIPPING               → LOADING
DELIVERY        → LOADING                → DELIVERY
```

### Validaciones del Backend
El backend debe validar:
1. La guía existe
2. El usuario tiene permisos para modificar la guía
3. El estado actual de la guía es válido para la transición
4. Todas las prendas de la guía están escaneadas (opcional)

### Manejo de Errores
```typescript
try {
  await guidesApi.updateStatus(guideId, newStatus);
} catch (error) {
  if (error.response?.status === 404) {
    Alert.alert('Error', 'Guía no encontrada');
  } else if (error.response?.status === 403) {
    Alert.alert('Error', 'No tienes permisos para modificar esta guía');
  } else if (error.response?.status === 400) {
    Alert.alert('Error', 'Estado de guía inválido');
  } else {
    Alert.alert('Error', 'No se pudo actualizar el estado de la guía');
  }
}
```

## Notas Adicionales

### Solo LAVADO y SECADO requieren confirmación
Los demás procesos no muestran el modal de confirmación y van directamente al escáner.

### Actualización de Prendas
Cuando se actualiza el estado de la guía, todas las prendas asociadas también deben actualizar su estado (esto lo maneja el backend).

### Sincronización
Después de actualizar el estado, se debe refrescar la lista de guías en el frontend para reflejar los cambios.

### Logs
Se recomienda agregar logs para tracking:
```typescript
console.log('🔄 Actualizando estado de guía:', {
  guideId: selectedGuideForConfirmation.id,
  currentStatus: selectedGuideForConfirmation.status,
  newStatus: getNewStatusFromProcess(selectedProcessType),
  processType: selectedProcessType,
});
```

## Testing

### Casos de Prueba
1. Confirmar cambio de estado exitoso
2. Cancelar cambio de estado
3. Error de red al actualizar
4. Guía no encontrada
5. Estado inválido
6. Permisos insuficientes

## Referencias
- Modal de Confirmación: `src/laundry/components/GuideStatusConfirmationModal.tsx`
- Lógica de Procesos: `src/components/layout/MainLayout.tsx`
- Constantes de Procesos: `src/constants/processes.ts`

