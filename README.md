# Gomez Ramos Propiedades

Aplicación full-stack para publicar y administrar propiedades inmobiliarias.

## Tecnologías

- **Frontend:** React, Vite, Lucide React y CSS.
- **Backend:** Node.js, Express, PostgreSQL, `pg`, JWT y bcryptjs.
- **Base de datos:** PostgreSQL.

## Requisitos

- Node.js 18 o superior.
- npm.
- PostgreSQL 14 o superior.

## Configuración de la base de datos

El script [`database/init.sql`](database/init.sql) crea la base `gomez_ramos`, las tablas del catálogo, consultas y usuarios, además de seis propiedades de ejemplo.

```bash
psql -U postgres -f database/init.sql
```

El script está comentado por secciones. `properties` guarda el catálogo, `inquiries` conserva los formularios recibidos y `users` contiene únicamente hashes bcrypt de las contraseñas.

## Configuración del backend

```bash
cp backend/.env.example backend/.env
npm install --prefix backend
npm run seed --prefix backend
npm run dev
```

Editá `.env` si tu conexión de PostgreSQL es diferente. `npm run seed` crea o actualiza el usuario administrador usando `ADMIN_USERNAME` y `ADMIN_PASSWORD`; nunca guarda la contraseña sin hash.

En desarrollo, la web queda disponible en `http://localhost:5173` y la API en
`http://localhost:8080/api`.

## Configuración del frontend

El comando recomendado desde la raíz es `npm run dev`, que levanta ambos servicios.

## Funcionalidades

### Sitio público

- Catálogo de propiedades con búsqueda por texto.
- Filtros por tipo y operación.
- Detalle de cada propiedad en `/propiedades/:id`.
- Formulario de contacto persistido en PostgreSQL.
- Vista institucional del estudio.

### Administración

La vista administrativa está en `/admin/`. Después de autenticarse, permite:

- Ver todas las propiedades en formato de lista.
- Añadir nuevas propiedades.
- Editar sus detalles.
- Eliminar propiedades con confirmación.
- Cerrar la sesión y borrar el token local.

## Endpoints

### Públicos

- `GET /api/properties` — catálogo completo.
- `GET /api/properties?search=palermo&type=Departamento&operation=Venta` — búsqueda y filtros.
- `GET /api/properties/:id` — detalle de una propiedad.
- `POST /api/contact` — guarda una consulta.
- `POST /api/auth/login` — autentica un usuario y devuelve un JWT.

### Protegidos

Estos endpoints requieren `Authorization: Bearer <token>`:

- `GET /api/auth/me` — valida la sesión.
- `GET /api/admin/properties` — lista administrativa.
- `POST /api/admin/properties` — crea una propiedad.
- `PUT /api/admin/properties/:id` — modifica una propiedad.
- `DELETE /api/admin/properties/:id` — elimina una propiedad.
- `GET /api/admin/inquiries` — lista las consultas descifradas para el administrador.
- `PATCH /api/admin/inquiries/:id` — marca una consulta como atendida o pendiente.
- `DELETE /api/admin/inquiries/:id` — elimina una consulta.

## Seguridad

En producción se debe definir `NODE_ENV=production`, un `JWT_SECRET` y un
`INQUIRY_ENCRYPTION_KEY` largos y aleatorios, cambiar las credenciales iniciales,
servir la aplicación mediante HTTPS y restringir `FRONTEND_URL` al dominio real.
El JWT expira a las ocho horas y los datos de contacto se cifran en PostgreSQL.

## Puesta en producción

```bash
npm install --prefix backend
npm install --prefix frontend
npm run build
npm start
```

Con `NODE_ENV=production`, el backend sirve `frontend/dist`, la API y
`resources/` desde el mismo puerto. Antes de iniciar, verificá PostgreSQL,
`DATABASE_URL`, las dos claves criptográficas y ejecutá `npm run admin:create`
para crear el primer administrador. El archivo `backend/.env` no debe versionarse.

El favicon fuente está en `frontend/public/icon.png`; Vite lo publica como
`/icon.png` y lo copia a `frontend/dist/icon.png` al compilar.

### Frontend en Vercel

Si el frontend se despliega en Vercel, elegí `frontend` como **Root Directory**.
Usá `Vite`, `npm run build`, `dist` y `npm install`. Definí en las variables de
entorno de Vercel:

```env
VITE_API_URL=https://api.tudominio.tech/api
```

Ese backend debe estar publicado y permitir el dominio de Vercel en `FRONTEND_URL`.
`frontend/vercel.json` mantiene funcionando las rutas `/admin/` y
`/propiedades/...` al recargar la página.

## Verificación

```bash
cd frontend && npm run build
cd ../backend && npm start
```

El frontend conserva datos de fallback para poder visualizar la interfaz aunque la API todavía no esté levantada.
