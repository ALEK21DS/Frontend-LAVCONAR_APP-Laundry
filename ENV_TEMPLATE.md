# Configuración de Variables de Entorno

## Archivo .env

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# URL del backend API
API_BASE_URL=http://localhost:3002/api
```

## Configuraciones según el entorno

### Desarrollo con ADB reverse (Recomendado para dispositivos USB)
```env
API_BASE_URL=http://localhost:3002/api
```
**Nota**: Ejecuta `adb reverse tcp:3002 tcp:3002` antes de usar la app

### Desarrollo con dispositivo físico en la misma red WiFi
```env
API_BASE_URL=http://TU_IP_LOCAL:3002/api
```
**Ejemplo**: `API_BASE_URL=http://192.168.100.30:3002/api`

**Para encontrar tu IP**:
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

### Desarrollo con emulador Android
```env
API_BASE_URL=http://10.0.2.2:3002/api
```

### Producción
```env
API_BASE_URL=https://api.tudominio.com/api
```

## Importante

1. **Después de modificar el .env**, reinicia Metro con:
   ```bash
   npx react-native start --reset-cache
   ```

2. **El archivo .env NO se sube a git** (ya está en `.gitignore`)

3. **Para ADB reverse**, ejecuta cada vez que conectes el dispositivo:
   ```bash
   adb reverse tcp:3002 tcp:3002
   ```

4. **Firewall**: Si usas WiFi, asegúrate de que el puerto 3002 esté abierto en Windows Firewall

