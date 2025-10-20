# Configuración de la API

## Configuración Actual

La aplicación usa variables de entorno para la configuración de la API.

## Cómo cambiar la URL de la API

### Opción 1: Modificar el archivo .env (Recomendado)
Edita el archivo `.env` en la raíz del proyecto:

```env
API_BASE_URL=http://TU_IP_LOCAL:3000/api
```

**Importante**: Después de modificar el archivo `.env`, debes:
1. Detener el servidor de Metro
2. Limpiar la caché: `npx react-native start --reset-cache`
3. Reconstruir la aplicación

### Opción 2: Usar el ConfigStore (programáticamente)
```typescript
import { useConfigStore } from '@/config/store/config.store';

const { setApiBaseUrl } = useConfigStore();

// Cambiar la URL
setApiBaseUrl('http://nueva-ip:3000/api');
```

## Encontrar tu IP local

### Windows:
```cmd
ipconfig
```
Busca la dirección IPv4 de tu adaptador de red.

### Mac/Linux:
```bash
ifconfig
```
Busca la dirección inet de tu interfaz de red.

## Verificar la conexión

1. Asegúrate de que el backend esté ejecutándose en el puerto 3000
2. Verifica que la IP sea correcta
3. Prueba la conexión desde el navegador: `http://TU_IP:3000/api`

## Notas importantes

- La URL se guarda en AsyncStorage, por lo que persiste entre sesiones
- Si cambias la URL, reinicia la aplicación para que tome efecto
- Para producción, usa una URL HTTPS segura
