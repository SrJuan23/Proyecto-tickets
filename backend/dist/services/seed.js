"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./db");
async function seedDatabase() {
    const enableSeed = process.env.ENABLE_SEED === 'true';
    if (!enableSeed) {
        console.log('[SEED] Ejecución de seed deshabilitada (ENABLE_SEED=false).');
        return;
    }
    const existingUsers = await db_1.db.query('SELECT COUNT(*) as count FROM usuarios');
    if (existingUsers[0]?.count > 0) {
        console.log('[SEED] Base de datos ya cuenta con datos iniciales.');
        return;
    }
    console.log('[SEED] Iniciando poblado de datos iniciales...');
    // 1. Usuarios con contraseñas seguras hasheadas
    const adminPass = await bcryptjs_1.default.hash('admin123', 10);
    const agentePass = await bcryptjs_1.default.hash('agente123', 10);
    const consultaPass = await bcryptjs_1.default.hash('consulta123', 10);
    await db_1.db.run(`INSERT INTO usuarios (nombre, email, password_hash, rol, estado, telefono, especialidad) VALUES 
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)`, [
        'Administrador del Sistema', 'admin@supportdesk.com', adminPass, 'ADMIN', 'ACTIVO', '+57 300 0000001', 'Administración General',
        'Didier Santamaría', 'didier.santamaria@supportdesk.com', agentePass, 'AGENTE', 'ACTIVO', '+57 311 2001122', 'Ciberseguridad FortiEDR / FortiMail',
        'Bryan Steven Sanchez', 'bryan.sanchez@supportdesk.com', agentePass, 'AGENTE', 'ACTIVO', '+57 312 3002233', 'Redes & Enlaces FlexWAN',
        'Auditor Consulta', 'consulta@supportdesk.com', consultaPass, 'CONSULTA', 'ACTIVO', '+57 300 0000002', 'Auditoría y Consultoría'
    ]);
    // 2. Clientes
    await db_1.db.run(`INSERT INTO clientes (nombre, nit, contacto_principal, correo_contacto, telefono, estado) VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)`, [
        'INVERSIONES CLÍNICA DEL META S.A.', '892000145-1', 'Jimmy Pardo', 'jpardo@clinicadelmeta.com.co', '+57 310 4567890', 'ACTIVO',
        'COASPHARMA SAS', '860012345-6', 'Andrea Gómez', 'agomez@coaspharma.com', '+57 312 8765432', 'ACTIVO',
        'DISTRIBUIDORA NACIONAL S.A.S.', '900345678-2', 'Felipe Castro', 'fcastro@distnal.com', '+57 315 9988776', 'ACTIVO',
        'BANCO COOPERATIVO DE COLOMBIA', '800987654-3', 'Marcela Peña', 'mpena@bancocoop.com.co', '+57 301 2233445', 'ACTIVO',
        'HOSPITAL UNIVERSITARIO CENTRAL', '890123456-7', 'Dr. Jorge Silva', 'jsilva@hospitalcentral.gov.co', '+57 318 5544332', 'ACTIVO',
        'SEGUROS Y REASEGURADORA ANDINA', '901234567-8', 'Carolina Duque', 'cduque@andina-seguros.com', '+57 314 1122334', 'ACTIVO'
    ]);
    // 3. Plataformas
    await db_1.db.run(`INSERT INTO plataformas (nombre, descripcion, color_badge, estado) VALUES
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)`, [
        'FORTIEDR', 'Endpoint Detection & Response y prevención de amenazas en tiempo real', '#0945F7', 'ACTIVO',
        'FORTIMAIL', 'Seguridad integral de correo electrónico y antispam', '#5B53FF', 'ACTIVO',
        'FLEXWAN', 'Infraestructura de conectividad SD-WAN y enlaces empresariales', '#00CDE2', 'ACTIVO'
    ]);
    // 4. Agentes
    await db_1.db.run(`INSERT INTO agentes (nombre, email, telefono, especialidad, estado) VALUES
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)`, [
        'Didier Santamaría', 'didier.santamaria@supportdesk.com', '+57 311 2001122', 'Ciberseguridad FortiEDR / FortiMail', 'ACTIVO',
        'Bryan Steven Sanchez', 'bryan.sanchez@supportdesk.com', '+57 312 3002233', 'Redes & Enlaces FlexWAN', 'ACTIVO',
        'Camila Rodríguez', 'camila.rodriguez@supportdesk.com', '+57 313 4003344', 'Soporte Nivel 2 y Correo Seguro', 'ACTIVO',
        'Carlos Andrés Morales', 'carlos.morales@supportdesk.com', '+57 314 5004455', 'Infraestructura y Monitoreo', 'ACTIVO'
    ]);
    // 5. Configuración del sistema
    await db_1.db.run(`INSERT INTO configuracion (clave, valor, descripcion) VALUES
      (?, ?, ?),
      (?, ?, ?),
      (?, ?, ?)`, [
        'SERVICENOW_BASE_URL', 'https://soporte.service-now.com/nav_to.do?uri=incident.do?sysparm_query=number=', 'URL base para apertura de incidentes en ServiceNow',
        'APP_NAME', 'Support Desk', 'Nombre institucional de la plataforma',
        'COMPANY_NAME', 'Mesa de Ayuda & Ciberseguridad', 'Nombre de la organización'
    ]);
    // 6. Tickets realistas
    const ticketData = [
        {
            prioridad: 'ALTO',
            cliente_id: 1, // CLÍNICA DEL META
            asunto: 'HABILITACIÓN DE PROGRAMA Y LIBRERÍAS',
            descripcion: 'Buen día, favor habilitar la ejecución de librerías DLL y binarios para el aplicativo de historia clínica digital en servidores de aplicación de urgencias.',
            plataforma_id: 1, // FORTIEDR
            solicitante: 'Jimmy Pardo',
            fecha_creacion: '2026-08-18 08:30:00',
            servicenow: 'CS0001252074',
            turno: 'T2',
            agente_id: 1, // Didier
            estado: 'EN PROCESO',
            fecha_actualizacion: '2026-08-18 10:15:00',
            fecha_cierre: null,
            tiempo_atencion_minutos: null
        },
        {
            prioridad: 'MEDIO',
            cliente_id: 2, // COASPHARMA
            asunto: 'RE: DESBLOQUEO APLICACIONES FORTINET',
            descripcion: 'Solicitud de exclusión en FortiEDR de instalador de nómina y facturación electrónica para estación de trabajo del área financiera.',
            plataforma_id: 1, // FORTIEDR
            solicitante: 'Andrea Gómez',
            fecha_creacion: '2026-08-17 09:14:00',
            servicenow: 'CS0001253838',
            turno: 'TD',
            agente_id: 2, // Bryan
            estado: 'RESUELTO',
            fecha_actualizacion: '2026-08-17 11:45:00',
            fecha_cierre: '2026-08-17 11:45:00',
            tiempo_atencion_minutos: 151
        },
        {
            prioridad: 'MEDIO',
            cliente_id: 1, // CLÍNICA DEL META
            asunto: 'REGLA DE BLOQUEO SPAM EN FORTIMAIL',
            descripcion: 'Se solicita revisión de remitentes en cuarentena por detección de falso positivo en comunicaciones entrantes con proveedores de insumos médicos.',
            plataforma_id: 2, // FORTIMAIL
            solicitante: 'Roberto Mejía',
            fecha_creacion: '2026-08-19 07:45:00',
            servicenow: 'CS0001253860',
            turno: 'T1',
            agente_id: 1, // Didier
            estado: 'ABIERTO',
            fecha_actualizacion: '2026-08-19 07:45:00',
            fecha_cierre: null,
            tiempo_atencion_minutos: null
        },
        {
            prioridad: 'ALTO',
            cliente_id: 4, // BANCO COOPERATIVO
            asunto: 'DEGRADACIÓN DE ENLACE PRINCIPAL SD-WAN',
            descripcion: 'Pérdida de paquetes en enlace de respaldo FlexWAN en sede principal. Se solicita diagnóstico de latencia y jitter.',
            plataforma_id: 3, // FLEXWAN
            solicitante: 'Marcela Peña',
            fecha_creacion: '2026-08-18 22:10:00',
            servicenow: 'CS0001254102',
            turno: 'TN',
            agente_id: 4, // Carlos Morales
            estado: 'EN PROCESO',
            fecha_actualizacion: '2026-08-19 01:20:00',
            fecha_cierre: null,
            tiempo_atencion_minutos: null
        },
        {
            prioridad: 'MEDIO',
            cliente_id: 3, // DISTRIBUIDORA NACIONAL
            asunto: 'CONFIGURACIÓN DE CUARENTENA DE CORREO COLECTIVA',
            descripcion: 'Solicitamos habilitar buzón de cuarentena compartida para el equipo de compras y validar políticas antispam.',
            plataforma_id: 2, // FORTIMAIL
            solicitante: 'Felipe Castro',
            fecha_creacion: '2026-08-16 14:20:00',
            servicenow: 'CS0001251990',
            turno: 'T4',
            agente_id: 3, // Camila
            estado: 'CERRADO',
            fecha_actualizacion: '2026-08-16 16:50:00',
            fecha_cierre: '2026-08-16 16:50:00',
            tiempo_atencion_minutos: 150
        },
        {
            prioridad: 'ALTO',
            cliente_id: 5, // HOSPITAL UNIVERSITARIO
            asunto: 'ALERTA DE RANSOMWARE MITIGADA EN SERVIDOR UCI',
            descripcion: 'FortiEDR bloqueó intento de cifrado sospechoso en equipo de laboratorio. Requiere análisis forense y reporte formal.',
            plataforma_id: 1, // FORTIEDR
            solicitante: 'Dr. Jorge Silva',
            fecha_creacion: '2026-08-19 06:10:00',
            servicenow: 'CS0001254500',
            turno: 'T1',
            agente_id: 1, // Didier
            estado: 'EN PROCESO',
            fecha_actualizacion: '2026-08-19 08:30:00',
            fecha_cierre: null,
            tiempo_atencion_minutos: null
        },
        {
            prioridad: 'MEDIO',
            cliente_id: 6, // SEGUROS ANDINA
            asunto: 'NUEVA POLÍTICA DE SEGURIDAD PARA SEDE MEDELLÍN',
            descripcion: 'Implementación de túnel seguro VPN IPSec y verificación de reglas de acceso sobre FlexWAN.',
            plataforma_id: 3, // FLEXWAN
            solicitante: 'Carolina Duque',
            fecha_creacion: '2026-08-15 11:00:00',
            servicenow: 'CS0001251120',
            turno: 'T2',
            agente_id: 2, // Bryan
            estado: 'CERRADO',
            fecha_actualizacion: '2026-08-15 15:30:00',
            fecha_cierre: '2026-08-15 15:30:00',
            tiempo_atencion_minutos: 270
        },
        {
            prioridad: 'MEDIO',
            cliente_id: 2, // COASPHARMA
            asunto: 'LIBERACIÓN DE CORREO BLOQUEADO POR SPF/DKIM',
            descripcion: 'Correo de auditoría externa retenido en FortiMail por falta de alineación DMARC temporal del emisor.',
            plataforma_id: 2, // FORTIMAIL
            solicitante: 'Andrea Gómez',
            fecha_creacion: '2026-08-18 15:40:00',
            servicenow: 'CS0001253999',
            turno: 'T4',
            agente_id: 3, // Camila
            estado: 'PENDIENTE',
            fecha_actualizacion: '2026-08-18 16:30:00',
            fecha_cierre: null,
            tiempo_atencion_minutos: null
        },
        {
            prioridad: 'ALTO',
            cliente_id: 1, // CLÍNICA DEL META
            asunto: 'DESCONEXIÓN INTERMITENTE DE COLECTOR FORTIEDR',
            descripcion: 'El colector central no reporta eventos desde la sede Villavicencio. Se requiere verificación de conectividad y reinicio de servicios.',
            plataforma_id: 1, // FORTIEDR
            solicitante: 'Jimmy Pardo',
            fecha_creacion: '2026-08-17 18:20:00',
            servicenow: 'CS0001253100',
            turno: 'TN',
            agente_id: 1, // Didier
            estado: 'RESUELTO',
            fecha_actualizacion: '2026-08-17 21:00:00',
            fecha_cierre: '2026-08-17 21:00:00',
            tiempo_atencion_minutos: 160
        },
        {
            prioridad: 'MEDIO',
            cliente_id: 4, // BANCO COOPERATIVO
            asunto: 'AJUSTE DE ANCHO DE BANDA EN CANAL SECUNDARIO',
            descripcion: 'Incremento de cuota de QoS para tráfico de videoconferencia corporativa en FlexWAN.',
            plataforma_id: 3, // FLEXWAN
            solicitante: 'Marcela Peña',
            fecha_creacion: '2026-08-14 10:00:00',
            servicenow: 'CS0001250550',
            turno: 'TD',
            agente_id: 2, // Bryan
            estado: 'CERRADO',
            fecha_actualizacion: '2026-08-14 12:15:00',
            fecha_cierre: '2026-08-14 12:15:00',
            tiempo_atencion_minutos: 135
        },
        {
            prioridad: 'MEDIO',
            cliente_id: 3, // DISTRIBUIDORA NACIONAL
            asunto: 'ACTUALIZACIÓN DE AGENTE FORTIEDR EN ESTACIONES WINDOWS 11',
            descripcion: 'Validación de compatibilidad de la versión 6.2 en equipos piloto antes de despliegue masivo.',
            plataforma_id: 1, // FORTIEDR
            solicitante: 'Felipe Castro',
            fecha_creacion: '2026-08-19 09:00:00',
            servicenow: 'CS0001254888',
            turno: 'T1',
            agente_id: 4, // Carlos
            estado: 'ABIERTO',
            fecha_actualizacion: '2026-08-19 09:00:00',
            fecha_cierre: null,
            tiempo_atencion_minutos: null
        },
        {
            prioridad: 'ALTO',
            cliente_id: 6, // SEGUROS ANDINA
            asunto: 'CAMPAÑA DE PHISHING DETECTADA EN FORTIMAIL',
            descripcion: 'Ataque de suplantación bancaria masivo recibido en múltiples casillas. Se crearon reglas de bloqueo de dominios.',
            plataforma_id: 2, // FORTIMAIL
            solicitante: 'Carolina Duque',
            fecha_creacion: '2026-08-16 08:15:00',
            servicenow: 'CS0001251800',
            turno: 'T1',
            agente_id: 3, // Camila
            estado: 'CERRADO',
            fecha_actualizacion: '2026-08-16 10:05:00',
            fecha_cierre: '2026-08-16 10:05:00',
            tiempo_atencion_minutos: 110
        }
    ];
    for (const t of ticketData) {
        const res = await db_1.db.run(`INSERT INTO tickets (prioridad, cliente_id, asunto, descripcion, plataforma_id, solicitante, fecha_creacion, servicenow, turno, agente_id, estado, fecha_actualizacion, fecha_cierre, tiempo_atencion_minutos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            t.prioridad, t.cliente_id, t.asunto, t.descripcion, t.plataforma_id, t.solicitante,
            t.fecha_creacion, t.servicenow, t.turno, t.agente_id, t.estado,
            t.fecha_actualizacion, t.fecha_cierre, t.tiempo_atencion_minutos
        ]);
        const ticketId = res.lastInsertRowid;
        // Historial inicial de creación
        await db_1.db.run(`INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_nuevo, fecha)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            ticketId,
            'Sistema',
            'CREACION',
            `Ticket #${ticketId} registrado en el sistema.`,
            t.estado,
            t.fecha_creacion
        ]);
        if (t.estado !== 'ABIERTO') {
            await db_1.db.run(`INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_anterior, valor_nuevo, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                ticketId,
                'Didier Santamaría',
                'CAMBIO_ESTADO',
                `Estado actualizado a ${t.estado}`,
                'ABIERTO',
                t.estado,
                t.fecha_actualizacion
            ]);
        }
    }
    console.log(`[SEED] Datos iniciales cargados exitosamente: ${ticketData.length} tickets de prueba creados.`);
}
