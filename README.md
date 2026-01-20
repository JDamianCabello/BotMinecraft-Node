# BotMinecraft-Node

Bot modular de Minecraft desarrollado con Mineflayer para automatización de tareas en servidores de Minecraft.

## Descripción

BotMinecraft-Node es un bot de Minecraft construido con Mineflayer que permite automatizar diversas tareas en servidores de Minecraft. El proyecto se enfoca en proporcionar funcionalidades de minería, agricultura y navegación inteligente con un sistema de comandos modular y extensible.

## Características

Minería automática
Sistema inteligente de minería por líneas rectas con priorización de minerales, permitiendo al bot extraer bloques específicos de forma eficiente.

Agricultura automatizada
Siembra, cosecha y replantado automático de cultivos. El bot puede gestionar campos completos sin intervención del usuario.

Navegación inteligente
Sistema de pathfinding avanzado que utiliza algoritmos de búsqueda de caminos para movimiento eficiente por el mundo de Minecraft.

Gestión de inventario
Manejo automático de herramientas y recursos. El bot optimiza el uso del espacio disponible y mantiene las herramientas necesarias.

Auto-alimentación
Sistema que mantiene al bot alimentado automáticamente, verificando niveles de hambre y consumiendo alimentos cuando es necesario.

Comandos modulares
Amplio conjunto de comandos para control remoto del bot desde el chat de Minecraft.

## Comandos Disponibles

Navegación

- `/goto`, `/ir` - Ir a spawn
- `/reset` - Ir al lobby y volver a spawn
- `/tpme` - Teleportarse al jugador

Minería

- `/mine` - Seleccionar mineral a binar
- `/stopmine` - Detener minería
- `/autominer` - Minería automática completa
- `/collect <tipo>` - Recolectar bloque específico

Agricultura

- `/farm` - Iniciar agricultura automática
- `/stopfarm` - Detener agricultura
- `/farmstatus` - Ver estado de agricultura

Sistema

- `/inv` - Ver inventario
- `/eat` - Comer inmediatamente
- `/help` - Mostrar todos los comandos disponibles

## Requisitos Previos

- Node.js >= 14.0.0
- npm (incluido con Node.js)
- Acceso a un servidor de Minecraft compatible con la versión 1.20.1

## Instalación

### 1. Clona el repositorio

```bash
git clone https://github.com/JDamianCabello/BotMinecraft-Node.git
cd BotMinecraft-Node
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Configura el bot

Edita el archivo `src/config/botConfig.js` con los datos de tu servidor:

```javascript
const botConfig = {
  host: 'localhost',      // IP del servidor
  port: 25565,            // Puerto del servidor
  username: 'BotName',    // Nombre del bot
  auth: 'offline'         // Tipo de autenticación
};
```

### 4. Ejecuta el bot

```bash
node src/index.js
```

## Dependencias

- **mineflayer**: Framework principal para la comunicación con el servidor Minecraft
- **mineflayer-pathfinder**: Sistema de navegación inteligente para movimiento del bot
- **minecraft-data**: Datos de bloques, items y entidades del juego
- **vec3**: Manejo de posiciones y cálculos vectoriales en 3D

## Estructura del Proyecto

```
BotMinecraft-Node/
├── src/
│   ├── config/
│   │   └── botConfig.js        # Configuración principal del bot
│   ├── commands/               # Módulos de comandos
│   │   ├── mining.js
│   │   ├── farming.js
│   │   ├── navigation.js
│   │   └── system.js
│   ├── systems/                # Sistemas del bot
│   │   ├── pathfinding.js
│   │   ├── inventory.js
│   │   └── autoEat.js
│   └── index.js                # Punto de entrada
├── package.json
└── README.md
```

## Configuración Avanzada

El bot está preconfigurado para trabajar con servidores Minecraft 1.20.1. Si necesitas cambiarlo a otra versión, modifica la propiedad `version` en `botConfig.js`:

```javascript
const botConfig = {
  version: '1.20.1'  // Cambia a la versión que necesites
};
```

Las versiones soportadas dependen de las librerías que utilizes. Consulta la documentación de mineflayer para ver qué versiones son compatibles.

## Uso Básico

### Conectar el bot a un servidor

Una vez configurado, ejecuta:

```bash
node src/index.js
```

El bot se conectará automáticamente al servidor especificado en `botConfig.js`.

### Usar comandos

Los comandos se ejecutan escribiendo en el chat del servidor:

```
/mine coal     # Empieza a minar carbón
/farm          # Inicia la agricultura automática
/goto spawn    # Va al spawn
/help          # Muestra la lista de comandos
```

### Monitorear el estado

El bot proporciona información en consola sobre:
- Conexión al servidor
- Ejecución de tareas actuales
- Errores y excepciones
- Estado del inventario

## Extensión del Bot

Para añadir nuevos comandos, crea un nuevo módulo en `src/commands/`:

```javascript
// src/commands/miNuevoComando.js
module.exports = {
  execute: (bot, args) => {
    // Tu lógica aquí
  }
};
```

Luego registra el comando en `src/index.js` en el manejador de eventos de chat.

## Solución de Problemas

### El bot no se conecta al servidor

Verifica que:
- La IP y puerto del servidor sean correctos en `botConfig.js`
- El servidor está en línea y accesible
- La versión de Minecraft coincide con la configurada
- El nombre de usuario del bot está disponible

### El bot se desconecta frecuentemente

Posibles causas:
- Conexión de red inestable
- Servidor ocupado o con lag
- Versión incompatible de Minecraft

### Los comandos no funcionan

Asegúrate de:
- Escribir correctamente el comando con la barra `/`
- Que el bot tenga permisos en el servidor
- Que el comando esté registrado en `src/index.js`

## Sobre Mineflayer

Mineflayer es un framework de código abierto que proporciona una API JavaScript para interactuar con servidores Minecraft. Permite crear bots que pueden realizar acciones dentro del juego de forma programática.

Para más información, consulta el repositorio oficial: https://github.com/PrismarineJS/mineflayer

## Enlaces Útiles

- [Documentación de Mineflayer](https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md)
- [minecraft-data](https://github.com/PrismarineJS/minecraft-data)
- [mineflayer-pathfinder](https://github.com/PrismarineJS/mineflayer-pathfinder)
- [Servidores de prueba para Minecraft](https://wiki.hypixel.net/Getting_Started)

## Licencia

Este proyecto está disponible bajo licencia MIT.

## Autor

Damián Cabello - [@JDamianCabello](https://github.com/JDamianCabello)
