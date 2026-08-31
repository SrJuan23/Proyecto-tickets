# 🛡️ Support Desk - Gestión de Casos y Mesa de Ayuda

Aplicación web empresarial, moderna, intuitiva y responsive diseñada para el **registro, gestión, seguimiento, auditoría y consulta de tickets y casos de soporte técnico**. Reemplaza hojas de cálculo de Excel por una plataforma estructurada con dashboard interactivo, filtros avanzados, exportación personalizada y control de roles.

---

## 🌟 Características Principales

1. **Dashboard Ejecutivo y Operativo**:
   - Tarjetas KPI en tiempo real: *Total de casos, Abiertos, En proceso, Pendientes, Resueltos, Cerrados, Prioridad Alta y Tiempo promedio de resolución*.
   - Selector dinámico de períodos: *Hoy, Últimos 7 días, Últimos 30 días, Este mes, Mes anterior y Rango personalizado*.
   - Gráficos interactivos con Chart.js:
     - 🍩 Distribución por Estado
     - 📊 Casos por Plataforma (*FLEXWAN, FORTIEDR, FORTIMAIL*)
     - 🎯 Casos por Prioridad (*MEDIO, ALTO, BAJO, CRÍTICO*)
     - 📈 Carga de trabajo por Agente de Soporte
     - 🏢 Top Clientes con mayor volumen de solicitudes
     - 📉 Evolución temporal de nuevos casos vs casos cerrados
   - Tabla de casos recientes con acceso directo al detalle.

2. **Registro y Gestión de Casos ("Casos")**:
   - Tabla con columnas: `ID`, `Prioridad`, `Cliente`, `Asunto`, `Plataforma`, `Solicitante`, `Fecha`, `ServiceNow`, `Turno`, `Atendido por`, `Estado` y `Acciones`.
   - **Búsqueda global instantánea** (por ID, cliente, asunto, solicitante, ServiceNow, agente, plataforma).
   - **Filtros avanzados combinables**: Prioridad, Cliente, Plataforma, Turno, Agente, Estado y Rango de fechas.
   - Pestaña de filtros activos con chips removibles y botón *"Limpiar filtros"*.
   - Paginación dinámica (10, 25, 50, 100 registros por página).
   - Ordenamiento interactivo por cualquier columna (ascendente / descendente).
   - Copiado rápido de identificadores de ServiceNow y ID del ticket.
   - Cambio ágil de estado mediante selector rápido.

3. **Formulario Estructurado de Casos ("+ Nuevo caso")**:
   - Organizado en 2 secciones claras:
     - **1. Información del caso**: Prioridad (selector visual), Plataforma (badges), Cliente (selector), Solicitante, Asunto del correo, Descripción amplia.
     - **2. Información de atención**: Agente asignado, Turno (`NA`, `T1`, `T2`, `T4`, `TD`, `TN`), Estado (`ABIERTO`, `EN PROCESO`, `PENDIENTE`, `RESUELTO`, `CERRADO`), ServiceNow ID y Fecha de creación.
   - Validaciones con mensajes de advertencia claros.

4. **Vista Detallada y Auditoría ("Slide-over Drawer")**:
   - Visualización completa de cliente, requerimiento, detalles técnicos y tiempos.
   - Cálculo automático del **Tiempo de Atención** (`Fecha de cierre - Fecha de creación`).
   - Botón directo para **abrir ServiceNow en una nueva pestaña** utilizando la URL parametrizable.
   - **Línea de tiempo / Historial de cambios**: Registra cada evento, reasignación de agente, cambio de estado y actualización con fecha y actor.

5. **Módulos Independientes**:
   - 🏢 **Clientes**: Administración de empresas, NIT, contactos y desglose de casos asociados.
   - 💻 **Plataformas**: Administración de tecnologías soportadas con badges de color e indicadores.
   - 👤 **Agentes**: Administración de ingenieros de soporte, especialidades y carga de trabajo.
   - 📈 **Centro de Reportes y Exportación**: Descarga filtrada a **Excel (.xlsx)** con formato corporativo y **CSV (.csv)** con codificación UTF-8 BOM.
   - ⚙️ **Configuración**: Parametrización de la URL base de ServiceNow y administración de usuarios/roles.

---

## 🎨 Identidad Visual y Diseño

- **Paleta de Colores Corporativa**:
  - Azul Primario: `#0945F7`
  - Azul Oscuro / Navy: `#19255A` (RGB: 25, 37, 90)
  - Cian: `#00CDE2`
  - Fondos Claros: `#F7F8FD`, `#EDF0FF`, `#D7E2FF`
  - Acentos: `#5B53FF`, `#3B4779`, `#006671`, `#001F90`
- **Tipografía**:
  - **Montserrat**: Títulos, encabezados, números KPI, botones destacados y badges.
  - **Lato**: Textos generales, descripciones de correo, formularios, tablas y contenido secundario.

---

## 🏗️ Arquitectura Técnica

```
Proyecto-tickets/
├── backend/
│   ├── src/
│   │   ├── config/            # Configuraciones
│   │   ├── controllers/       # Controladores de la API REST
│   │   ├── middleware/        # Autenticación JWT y roles
│   │   ├── models/            # Tipos e interfaces TypeScript
│   │   ├── routes/            # Enrutadores Express
│   │   ├── services/          # DB (PostgreSQL), Seed data, ExcelJS
│   │   └── server.ts          # Servidor Express
│   ├── database/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes UI modulares (Dashboard, Tickets, Modals, etc.)
│   │   ├── services/          # Cliente API y Sistema de Toasts
│   │   ├── types/             # Interfaces y modelos
│   │   ├── main.ts            # Router y bootstrap de la SPA
│   │   └── style.css          # Tailwind CSS y tokens de marca
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── run.bat                    # Lanzador rápido para Windows
├── start.ps1                  # Lanzador PowerShell
└── README.md
```

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- **Node.js** (v18.0 o superior) y **npm**.

### Opción 1: Ejecución Rápida con 1 Clic (Recomendada)
Haga doble clic en el archivo `run.bat` o ejecute en PowerShell:
```powershell
.\start.ps1
```
La aplicación iniciará automáticamente el servidor unificado y abrirá la URL **`http://localhost:3000`** en su navegador.

---

### Opción 2: Ejecución Manual

1. **Instalar dependencias**:
   ```bash
   # En la carpeta raíz
   npm run install:all
   ```

2. **Compilar Frontend y Backend**:
   ```bash
   npm run build
   ```

3. **Iniciar el Servidor**:
   ```bash
   npm start
   ```
   Abra en su navegador: **`http://localhost:3000`**

---

### Opción 3: Modo Desarrollo con Hot-Reload

Para desarrollar con recarga en vivo de cambios:
1. **Terminal 1 - Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   *(Servidor API en `http://localhost:3000`)*

2. **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   *(Servidor Vite con proxy en `http://localhost:5173`)*

---

## 🔑 Cuentas de Acceso y Demo

El sistema incluye cuentas de prueba precargadas con selector de 1 clic en el modal de inicio de sesión:

| Usuario | Correo Electrónico | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin@supportdesk.com` | `admin123` | `ADMIN` | Acceso total (CRUD tickets, clientes, plataformas, agentes, usuarios, config) |
| **Didier Santamaría** | `didier.santamaria@supportdesk.com` | `agente123` | `AGENTE` | Crear/editar casos, cambiar estados, consultar clientes y exportar |
| **Bryan Steven Sanchez** | `bryan.sanchez@supportdesk.com` | `agente123` | `AGENTE` | Crear/editar casos, cambiar estados, consultar clientes y exportar |
| **Auditor de Calidad** | `consulta@supportdesk.com` | `consulta123` | `CONSULTA` | Consulta de tickets, estadísticas del dashboard y exportación (solo lectura) |

---

## 🗄️ Configuración de Base de Datos

### PostgreSQL (Requerido)
El sistema utiliza **PostgreSQL** como motor de base de datos.

1. Instale PostgreSQL en su servidor.
2. Cree la base de datos y el usuario:
   ```sql
   CREATE USER support WITH PASSWORD 'support';
   CREATE DATABASE support_desk OWNER support;
   ```
3. En el archivo `backend/.env`, configure:
   ```env
   DB_CLIENT=postgres
   DATABASE_URL=postgresql://support:support@localhost:5432/support_desk
   ```

---

## 📡 Resumen de Endpoints API REST

### Autenticación
- `POST /api/auth/login`: Autenticación con JWT.
- `GET /api/auth/me`: Perfil del usuario autenticado.
- `GET /api/auth/demo-accounts`: Lista de cuentas de prueba activas.

### Tickets / Casos
- `GET /api/tickets`: Listado con filtros combinados, búsqueda global, ordenamiento y paginación.
- `GET /api/tickets/:id`: Detalle completo del caso con su historial de auditoría y URL de ServiceNow.
- `POST /api/tickets`: Creación de nuevo caso.
- `PUT /api/tickets/:id`: Actualización general del caso.
- `PATCH /api/tickets/:id/estado`: Cambio rápido de estado con cálculo automático de fecha/tiempo de cierre.
- `DELETE /api/tickets/:id`: Eliminación física del caso e historial (solo ADMIN).

### Métricas y Dashboard
- `GET /api/stats/kpis`: Conteo general de casos por estado, prioridad y tiempo promedio de atención.
- `GET /api/stats/charts`: Agregaciones para los 6 gráficos con filtro de período.

### Exportación
- `GET /api/export/excel`: Descarga de archivo `.xlsx` respetando los filtros activos.
- `GET /api/export/csv`: Descarga de archivo `.csv` con codificación UTF-8 BOM.

### Clientes, Plataformas, Agentes y Usuarios
- `GET/POST/PUT/PATCH /api/clientes`
- `GET/POST/PUT/PATCH /api/plataformas`
- `GET/POST/PUT/PATCH /api/agentes`
- `GET/POST/PUT/DELETE /api/usuarios`
- `GET/PUT /api/config`
