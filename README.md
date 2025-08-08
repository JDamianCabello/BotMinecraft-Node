# BotMinecraft-Node

🤖 Bot modular de Minecraft desarrollado con **Mineflayer** para automatización de tareas en servidores de Minecraft.

## 🚀 Características

- **Minería automática**: Sistema inteligente de minería por líneas rectas con priorización de minerales
- **Agricultura automatizada**: Siembra, cosecha y replantado automático de cultivos
- **Navegación inteligente**: Sistema de pathfinding avanzado para movimiento eficiente
- **Gestión de inventario**: Manejo automático de herramientas y recursos
- **Auto-alimentación**: Sistema que mantiene al bot alimentado automáticamente
- **Comandos modulares**: Amplio conjunto de comandos para control remoto

## 📋 Comandos Disponibles

### Navegación
- `/goto`, `/ir` - Ir a spawn
- `/reset` - Ir al lobby y volver a spawn
- `/tpme` - Teleportarse al jugador

### Minería
- `/mine` - Seleccionar mineral a minar
- `/stopmine` - Detener minería
- `/autominer` - Minería automática completa
- `/collect <tipo>` - Recolectar bloque específico

### Agricultura
- `/farm` - Iniciar agricultura automática
- `/stopfarm` - Detener agricultura
- `/farmstatus` - Ver estado de agricultura

### Sistema
- `/inv` - Ver inventario
- `/eat` - Comer inmediatamente
- `/help` - Mostrar todos los comandos disponibles

## 🛠️ Instalación

1. Clona el repositorio
```bash
git clone https://github.com/JDamianCabello/BotMinecraft-Node.git
cd BotMinecraft-Node
```

2. Instala las dependencias
```bash
npm install
```

3. Configura el bot en `src/config/botConfig.js`

4. Ejecuta el bot
```bash
node src/index.js
```

## 📚 Dependencias

- **mineflayer**: Framework principal del bot
- **mineflayer-pathfinder**: Sistema de navegación
- **minecraft-data**: Datos de bloques y items
- **vec3**: Manejo de posiciones 3D

## ⚙️ Configuración

El bot está configurado para trabajar con servidores de Minecraft 1.20.1. Puedes modificar la configuración en `src/config/botConfig.js` para adaptarlo a tu servidor.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias o mejoras.
