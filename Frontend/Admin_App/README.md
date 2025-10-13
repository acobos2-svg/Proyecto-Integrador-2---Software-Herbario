# Herbario Digital - Tax-IFN | Panel de Administración

Panel de administración web para la gestión de herbarios y usuarios del sistema Herbario Digital - Tax-IFN.

## 🚀 Características

- **Gestión de Herbarios**: Crear, editar, activar/desactivar herbarios
- **Gestión de Usuarios**: Administrar usuarios por herbario con diferentes roles
- **Dashboard**: Vista general con estadísticas del sistema
- **Autenticación**: Sistema de login seguro para administradores
- **Interfaz Moderna**: Diseño responsive con Vue.js 3

## 🛠️ Tecnologías

- **Vue.js 3.5.22**: Framework frontend con Composition API
- **Vue Router 4**: Navegación SPA
- **Axios**: Cliente HTTP para API REST
- **Vite**: Build tool y servidor de desarrollo
- **CSS3**: Estilos modernos con variables CSS

## 📦 Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

3. **Construir para producción**:
   ```bash
   npm run build
   ```

## 🔧 Configuración

### Variables de Entorno

La aplicación se conecta por defecto a `http://localhost:3002` donde debe estar ejecutándose el servicio **Gest_Herb_service**.

### Credenciales de Prueba

- **Usuario**: `admin`
- **Contraseña**: `admin`

## 📋 Funcionalidades

### Dashboard
- Estadísticas generales del sistema
- Número total de herbarios y usuarios
- Distribución de roles
- Accesos rápidos a las funciones principales

### Gestión de Herbarios
- ✅ Crear nuevos herbarios
- ✅ Editar información existente
- ✅ Activar/desactivar herbarios
- ✅ Eliminar herbarios
- ✅ Validación de datos

### Gestión de Usuarios
- ✅ Crear usuarios por herbario
- ✅ Asignar roles (Admin, Curador, Investigador, Estudiante, Visitante)
- ✅ Filtrar usuarios por herbario
- ✅ Editar información de usuario
- ✅ Activar/desactivar usuarios
- ✅ Eliminar usuarios

### Roles de Usuario
- **Administrador**: Control total del herbario
- **Curador**: Gestión de colecciones y muestras
- **Investigador**: Consulta y análisis de datos
- **Estudiante**: Acceso de estudio
- **Visitante**: Consulta básica

## 🌐 API Endpoints

La aplicación consume los siguientes endpoints del servicio backend:

### Autenticación
- `POST /admin/login` - Iniciar sesión

### Herbarios
- `GET /admin/herbarios` - Listar herbarios
- `POST /admin/herbarios` - Crear herbario
- `PUT /admin/herbarios/:id` - Actualizar herbario
- `DELETE /admin/herbarios/:id` - Eliminar herbario

### Usuarios
- `GET /admin/usuarios` - Listar usuarios
- `POST /admin/usuarios` - Crear usuario
- `PUT /admin/usuarios/:id` - Actualizar usuario
- `DELETE /admin/usuarios/:id` - Eliminar usuario

### Estadísticas
- `GET /admin/estadisticas` - Obtener estadísticas generales

## 🎨 Estructura del Proyecto

```
src/
├── components/
│   ├── Login.vue           # Pantalla de autenticación
│   ├── Dashboard.vue       # Panel principal
│   ├── NavBar.vue         # Barra de navegación
│   ├── HerbariosManager.vue # Gestión de herbarios
│   └── UsuariosManager.vue  # Gestión de usuarios
├── router/
│   └── index.js           # Configuración de rutas
├── App.vue                # Componente raíz
└── main.js               # Punto de entrada

```

## 🔒 Seguridad

- Autenticación basada en tokens
- Guards de navegación para rutas protegidas
- Validación de formularios
- Sanitización de datos de entrada

## 📱 Responsive Design

La aplicación está optimizada para:
- 💻 Desktop (1200px+)
- 📱 Tablet (768px - 1199px)
- 📱 Mobile (< 768px)

## 🚀 Despliegue

Para desplegar en producción:

1. Construir la aplicación:
   ```bash
   npm run build
   ```

2. Los archivos estáticos estarán en `dist/`

3. Servir los archivos con cualquier servidor HTTP

## 🔗 Dependencias del Sistema

Esta aplicación requiere que esté ejecutándose:
- **Gest_Herb_service** en puerto 3002
- **Base de datos Supabase** configurada

## 📝 Notas de Desarrollo

- La aplicación utiliza localStorage para manejar tokens de autenticación
- Los modales están implementados como componentes inline
- El sistema de notificaciones utiliza mensajes de error simples
- Las validaciones se manejan tanto en frontend como backend

## 🤝 Contribución

Para contribuir al proyecto:
1. Fork el repositorio
2. Crear rama de feature
3. Commit cambios
4. Push a la rama
5. Crear Pull Request

---

**Herbario Digital - Tax-IFN** | Sistema de Gestión de Herbarios
