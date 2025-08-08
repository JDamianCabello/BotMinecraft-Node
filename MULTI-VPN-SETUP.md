# 🌐 Sistema Multi-VPN para Minecraft Bots

Este sistema permite que cada instancia de bot use una VPN/proxy diferente, apareciendo desde IPs distintas para el servidor.

## 📋 Configuración Rápida

### 1. Configurar tus Proxies/VPNs

Edita `src/config/proxyConfig.js` y actualiza la información de tus proxies:

```javascript
this.proxyPool = [
  {
    id: 'proxy1',
    host: '192.168.1.100',    // IP de tu primer proxy/VPN
    port: 1080,               // Puerto SOCKS5
    username: 'usuario',      // Opcional
    password: 'contraseña',   // Opcional
    region: 'US-East',
    active: false
  },
  // Agrega más proxies aquí...
]
```

### 2. Métodos de Lanzamiento

#### Opción A: Launcher Automático (Recomendado)
```bash
node launch-multiple-bots.js
```
Esto lanzará múltiples bots automáticamente, cada uno con una VPN diferente.

#### Opción B: Manual Individual
```bash
# Bot 1 - Proxy automático del pool
node src/index.js

# Bot 2 - Proxy específico
node src/index.js --proxy=192.168.1.100:1080

# Bot 3 - Proxy con autenticación
node src/index.js --proxy=192.168.1.101:1080:usuario:contraseña
```

## 🔧 Configuración de Proxies

### Tipos de Proxy Soportados
- **SOCKS5** (Recomendado)
- Con o sin autenticación
- Múltiples regiones/países

### Configuración por Servicio VPN

#### NordVPN
```javascript
{
  host: 'us1234.nordvpn.com',
  port: 1080,                    // Puerto SOCKS5 de NordVPN
  username: 'tu_usuario_nord',
  password: 'tu_contraseña_nord'
}
```

#### ExpressVPN  
```javascript
{
  host: 'proxy-server.expressvpn.com',
  port: 1080,
  username: 'tu_usuario_express',
  password: 'tu_contraseña_express'
}
```

#### Proxy Privado
```javascript
{
  host: '123.456.789.012',      // IP de tu proxy
  port: 1080,
  username: null,               // Si no requiere autenticación
  password: null
}
```

## 🎮 Comandos Disponibles

Una vez que los bots estén ejecutándose:

```
/proxies    - Ver estado de todos los proxies
/myproxy    - Ver qué proxy está usando este bot
/help       - Ver todos los comandos disponibles
```

## 📊 Ejemplo de Uso

```bash
# Terminal 1: Lanzar múltiples bots
node launch-multiple-bots.js

# Los bots se conectarán así:
# Bot1 -> proxy1 (US-East)
# Bot2 -> proxy2 (US-West)  
# Bot3 -> proxy3 (US-Central)
# Bot4 -> proxy4 (Canada)
# Bot5 -> proxy5 (Mexico)
```

## 🔍 Verificación

Para verificar que los bots usan IPs diferentes:

1. **En el juego**: Usa `/myproxy` para ver qué proxy usa cada bot
2. **Desde consola**: Los logs mostrarán la conexión proxy
3. **Estado general**: Usa `/proxies` para ver todos los proxies activos

## ⚠️ Notas Importantes

### Requisitos
- Node.js instalado
- Paquete `socks` instalado: `npm install socks`
- Proxies/VPNs SOCKS5 configurados

### Limitaciones
- Máximo 5 proxies configurados por defecto (editable)
- Solo SOCKS5 soportado actualmente
- Requiere que tus VPNs/proxies soporten SOCKS5

### Troubleshooting

**Error de conexión proxy:**
```
❌ Error conectando proxy: Connection refused
```
- Verifica que la IP y puerto sean correctos
- Asegúrate que el proxy esté activo
- Comprueba la autenticación si es requerida

**Bot usa conexión directa:**
```
⚠️ No hay proxies disponibles, conectando directamente
```
- Todos los proxies del pool están ocupados
- Aumenta el número de proxies en `proxyConfig.js`

## 📝 Personalización

### Añadir más proxies
Edita `proxyConfig.js` y agrega más entradas al array `proxyPool`.

### Cambiar regiones
Modifica el campo `region` para identificar fácilmente tus proxies.

### Proxy por línea de comandos
```bash
node src/index.js --proxy=IP:PUERTO:USUARIO:CONTRASEÑA
```

## 🚀 Ejemplo Completo

1. **Configurar proxies** en `src/config/proxyConfig.js`
2. **Ejecutar**: `node launch-multiple-bots.js`
3. **Verificar**: Los bots mostrarán diferentes IPs en los logs
4. **Comandos**: Usar `/myproxy` en cada bot para confirmar

¡Ahora cada bot aparecerá desde una IP diferente en el servidor de Minecraft!