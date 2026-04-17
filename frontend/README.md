# Control Financiero Frontend

Frontend migrado a `React + Vite + React Router`, con `Tailwind CSS` para layout y utilidades, y `MUI` para la base de componentes compartidos.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

La app de desarrollo corre en `http://localhost:3001`.

## Conexion con backend

Por defecto el frontend usa:

- `VITE_API_URL=/api/v1`
- `VITE_PROXY_TARGET=http://localhost:3000`

Con esa configuracion, `Vite` redirige las llamadas `/api/*` al backend local en `http://localhost:3000`, asi que:

1. Arranca el backend en `http://localhost:3000`
2. Arranca el frontend con `npm run dev`
3. El frontend queda consumiendo la API sin cambiar codigo

Si en otro entorno el backend vive en otra URL, cambia `VITE_API_URL` por una URL completa, por ejemplo:

```bash
VITE_API_URL=https://api.midominio.com/api/v1
```

## Stack

- React 19
- Vite 7
- React Router
- Tailwind CSS v4
- MUI 7
- React Query
- Axios

## Nota de despliegue

Si el frontend se publica como SPA, el servidor debe redirigir las rutas no estaticas a `index.html` para que `react-router-dom` pueda resolverlas en cliente.
