# HITAZA

HITAZA es una primera versión funcional de un asistente personal con personalidad cercana, técnica y natural. Está enfocada en:

- videojuegos
- astronomía y astrofísica
- ciencia
- filosofía
- preguntas generales

## Tecnología elegida

- React + Vite para la interfaz web
- Express para el backend
- OpenAI compatible para la IA (opcional)

Esto permite que la app funcione muy bien en móvil, sea sencilla de ampliar y mantenga la API key segura en el servidor, no en el navegador.

## Requisitos

- Node.js 18 o superior
- npm

## Configuración

1. Copia `.env.example` a `.env`
2. Si quieres usar OpenAI real, añade tu clave en `OPENAI_API_KEY`
3. Instala dependencias:

```bash
npm install
```

## Ejecutar la app

```bash
npm run dev
```

La app estará disponible en:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Importante sobre seguridad

Nunca pongas claves API en el código fuente. Usa variables de entorno del servidor.

Para obtener una clave OpenAI:

- Entra en https://platform.openai.com/api-keys
- Crea una clave nueva
- Pégala en tu archivo `.env` local

La variable que usa el proyecto es:

```env
OPENAI_API_KEY=tu_clave_aquí
```

Si no añades la clave, HITAZA seguirá funcionando en modo local con respuesta generada por lógica del proyecto.

## Primera versión

La primera versión incluye:

- interfaz moderna y responsive
- chat funcional
- modos: NORMAL, RESUMEN, INFORMACIÓN ACTUAL, BUSCAR MÁS A FONDO e INFORMACIÓN GENERAL
- personalidad de HITAZA
- estructura de historial de chats preparada para ampliarse
- estructura para colecciones/favoritos

## Siguientes pasos

- búsqueda web real
- análisis de imágenes
- voz y activación por voz
- más herramientas del asistente personal
