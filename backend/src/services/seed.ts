import bcrypt from 'bcryptjs';
import { db } from './db';

export async function seedDatabase(): Promise<void> {
  const enableSeed = process.env.ENABLE_SEED === 'true';

  if (!enableSeed) {
    console.log('[SEED] Ejecución de seed deshabilitada (ENABLE_SEED=false).');
    return;
  }

  const existingUsers = await db.query('SELECT COUNT(*) as count FROM usuarios');
  if (existingUsers[0]?.count > 0) {
    console.log('[SEED] Base de datos ya cuenta con datos iniciales.');
    return;
  }

  console.log('[SEED] Iniciando poblado de datos iniciales...');

  const adminPass = await bcrypt.hash('admin123', 10);
  const supportPass = await bcrypt.hash('agente123', 10);
  const consultaPass = await bcrypt.hash('consulta123', 10);

  await db.run(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, estado, telefono, especialidad) VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Administrador del Sistema', 'admin@supportdesk.com', adminPass, 'ADMIN', 'ACTIVO', '+57 300 0000001', 'Administración General',
      'Didier Santamaría', 'didier.santamaria@supportdesk.com', supportPass, 'AGENTE', 'ACTIVO', '+57 311 2001122', 'Ciberseguridad FortiEDR / FortiMail',
      'Bryan Steven Sanchez', 'bryan.sanchez@supportdesk.com', supportPass, 'AGENTE', 'ACTIVO', '+57 312 3002233', 'Redes & Enlaces FlexWAN',
      'Auditor Consulta', 'consulta@supportdesk.com', consultaPass, 'CONSULTA', 'ACTIVO', '+57 300 0000002', 'Auditoría y Consultoría'
    ]
  );

  await db.run(
    `INSERT INTO clientes (nombre, nit, contacto_principal, correo_contacto, telefono, estado) VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)`,
    [
      'INVERSIONES CLÍNICA DEL META S.A.', '892000145-1', 'Jimmy Pardo', 'jpardo@clinicadelmeta.com.co', '+57 310 4567890', 'ACTIVO',
      'COASPHARMA SAS', '860012345-6', 'Andrea Gómez', 'agomez@coaspharma.com', '+57 312 8765432', 'ACTIVO',
      'DISTRIBUIDORA NACIONAL S.A.S.', '900345678-2', 'Felipe Castro', 'fcastro@distnal.com', '+57 315 9988776', 'ACTIVO',
      'BANCO COOPERATIVO DE COLOMBIA', '800987654-3', 'Marcela Peña', 'mpena@bancocoop.com.co', '+57 301 2233445', 'ACTIVO',
      'HOSPITAL UNIVERSITARIO CENTRAL', '890123456-7', 'Dr. Jorge Silva', 'jsilva@hospitalcentral.gov.co', '+57 318 5544332', 'ACTIVO',
      'SEGUROS Y REASEGURADORA ANDINA', '901234567-8', 'Carolina Duque', 'cduque@andina-seguros.com', '+57 314 1122334', 'ACTIVO'
    ]
  );

  await db.run(
    `INSERT INTO plataformas (nombre, descripcion, color_badge, estado) VALUES
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)`,
    [
      'FORTIEDR', 'Endpoint Detection & Response y prevención de amenazas en tiempo real', '#0945F7', 'ACTIVO',
      'FORTIMAIL', 'Seguridad integral de correo electrónico y antispam', '#5B53FF', 'ACTIVO',
      'FLEXWAN', 'Infraestructura de conectividad SD-WAN y enlaces empresariales', '#00CDE2', 'ACTIVO'
    ]
  );

  await db.run(
    `INSERT INTO configuracion (clave, valor, descripcion) VALUES
      (?, ?, ?),
      (?, ?, ?),
      (?, ?, ?)`,
    [
      'SERVICENOW_BASE_URL', 'https://soporte.service-now.com/nav_to.do?uri=incident.do?sysparm_query=number=', 'URL base para apertura de incidentes en ServiceNow',
      'APP_NAME', 'Support Desk', 'Nombre institucional de la plataforma',
      'COMPANY_NAME', 'Mesa de Ayuda & Ciberseguridad', 'Nombre de la organización'
    ]
  );

  const ticketData = [
    {
      prioridad: 'ALTO',
      cliente_id: 1,
      asunto: 'HABILITACIÓN DE PROGRAMA Y LIBRERÍAS',
      descripcion: 'Buen día, favor habilitar la ejecución de librerías DLL y binarios para el aplicativo de historia clínica digital en servidores de aplicación de urgencias.',
      plataforma_id: 1,
      solicitante: 'Jimmy Pardo',
      fecha_creacion: '2026-08-18 08:30:00',
      servicenow: 'CS0001252074',
      turno: 'T2',
      estado: 'EN PROCESO',
      fecha_actualizacion: '2026-08-18 10:15:00',
      fecha_cierre: null,
      tiempo_atencion_minutos: null
    },
    {
      prioridad: 'MEDIO',
      cliente_id: 2,
      asunto: 'RE: DESBLOQUEO APLICACIONES FORTINET',
      descripcion: 'Solicitud de exclusión en FortiEDR de instalador de nómina y facturación electrónica para estación de trabajo del área financiera.',
      plataforma_id: 1,
      solicitante: 'Andrea Gómez',
      fecha_creacion: '2026-08-17 09:14:00',
      servicenow: 'CS0001253838',
      turno: 'TD',
      estado: 'RESUELTO',
      fecha_actualizacion: '2026-08-17 11:45:00',
      fecha_cierre: '2026-08-17 11:45:00',
      tiempo_atencion_minutos: 151
    },
    {
      prioridad: 'MEDIO',
      cliente_id: 1,
      asunto: 'REGLA DE BLOQUEO SPAM EN FORTIMAIL',
      descripcion: 'Se solicita revisión de remitentes en cuarentena por detección de falso positivo en comunicaciones entrantes con proveedores de insumos médicos.',
      plataforma_id: 2,
      solicitante: 'Roberto Mejía',
      fecha_creacion: '2026-08-19 07:45:00',
      servicenow: 'CS0001253860',
      turno: 'T1',
      estado: 'ABIERTO',
      fecha_actualizacion: '2026-08-19 07:45:00',
      fecha_cierre: null,
      tiempo_atencion_minutos: null
    },
    {
      prioridad: 'ALTO',
      cliente_id: 4,
      asunto: 'DEGRADACIÓN DE ENLACE PRINCIPAL SD-WAN',
      descripcion: 'Pérdida de paquetes en enlace de respaldo FlexWAN en sede principal. Se solicita diagnóstico de latencia y jitter.',
      plataforma_id: 3,
      solicitante: 'Marcela Peña',
      fecha_creacion: '2026-08-18 22:10:00',
      servicenow: 'CS0001254102',
      turno: 'TN',
      estado: 'EN PROCESO',
      fecha_actualizacion: '2026-08-19 01:20:00',
      fecha_cierre: null,
      tiempo_atencion_minutos: null
    },
    {
      prioridad: 'MEDIO',
      cliente_id: 3,
      asunto: 'CONFIGURACIÓN DE CUARENTENA DE CORREO COLECTIVA',
      descripcion: 'Solicitamos habilitar buzón de cuarentena compartida para el equipo de compras y validar políticas antispam.',
      plataforma_id: 2,
      solicitante: 'Felipe Castro',
      fecha_creacion: '2026-08-16 14:20:00',
      servicenow: 'CS0001251990',
      turno: 'T4',
      estado: 'CERRADO',
      fecha_actualizacion: '2026-08-16 16:50:00',
      fecha_cierre: '2026-08-16 16:50:00',
      tiempo_atencion_minutos: 150
    },
    {
      prioridad: 'ALTO',
      cliente_id: 5,
      asunto: 'ALERTA DE RANSOMWARE MITIGADA EN SERVIDOR UCI',
      descripcion: 'FortiEDR bloqueó intento de cifrado sospechoso en equipo de laboratorio. Requiere análisis forense y reporte formal.',
      plataforma_id: 1,
      solicitante: 'Dr. Jorge Silva',
      fecha_creacion: '2026-08-19 06:10:00',
      servicenow: 'CS0001254500',
      turno: 'T1',
      estado: 'EN PROCESO',
      fecha_actualizacion: '2026-08-19 08:30:00',
      fecha_cierre: null,
      tiempo_atencion_minutos: null
    },
    {
      prioridad: 'MEDIO',
      cliente_id: 6,
      asunto: 'NUEVA POLÍTICA DE SEGURIDAD PARA SEDE MEDELLÍN',
      descripcion: 'Implementación de túnel seguro VPN IPSec y verificación de reglas de acceso sobre FlexWAN.',
      plataforma_id: 3,
      solicitante: 'Carolina Duque',
      fecha_creacion: '2026-08-15 11:00:00',
      servicenow: 'CS0001251120',
      turno: 'T2',
      estado: 'CERRADO',
      fecha_actualizacion: '2026-08-15 15:30:00',
      fecha_cierre: '2026-08-15 15:30:00',
      tiempo_atencion_minutos: 270
    },
    {
      prioridad: 'MEDIO',
      cliente_id: 2,
      asunto: 'LIBERACIÓN DE CORREO BLOQUEADO POR SPF/DKIM',
      descripcion: 'Correo de auditoría externa retenido en FortiMail por falta de alineación DMARC temporal del emisor.',
      plataforma_id: 2,
      solicitante: 'Andrea Gómez',
      fecha_creacion: '2026-08-18 15:40:00',
      servicenow: 'CS0001253999',
      turno: 'T4',
      estado: 'PENDIENTE',
      fecha_actualizacion: '2026-08-18 16:30:00',
      fecha_cierre: null,
      tiempo_atencion_minutos: null
    },
    {
      prioridad: 'ALTO',
      cliente_id: 1,
      asunto: 'DESCONEXIÓN INTERMITENTE DE COLECTOR FORTIEDR',
      descripcion: 'El colector central no reporta eventos desde la sede Villavicencio. Se requiere verificación de conectividad y reinicio de servicios.',
      plataforma_id: 1,
      solicitante: 'Jimmy Pardo',
      fecha_creacion: '2026-08-17 18:20:00',
      servicenow: 'CS0001253100',
      turno: 'TN',
      estado: 'RESUELTO',
      fecha_actualizacion: '2026-08-17 21:00:00',
      fecha_cierre: '2026-08-17 21:00:00',
      tiempo_atencion_minutos: 160
    },
    {
      prioridad: 'MEDIO',
      cliente_id: 4,
      asunto: 'AJUSTE DE ANCHO DE BANDA EN CANAL SECUNDARIO',
      descripcion: 'Incremento de cuota de QoS para tráfico de videoconferencia corporativa en FlexWAN.',
      plataforma_id: 3,
      solicitante: 'Marcela Peña',
      fecha_creacion: '2026-08-14 10:00:00',
      servicenow: 'CS0001250550',
      turno: 'TD',
      estado: 'CERRADO',
      fecha_actualizacion: '2026-08-14 12:15:00',
      fecha_cierre: '2026-08-14 12:15:00',
      tiempo_atencion_minutos: 135
    },
    {
      prioridad: 'MEDIO',
      cliente_id: 3,
      asunto: 'ACTUALIZACIÓN DE AGENTE FORTIEDR EN ESTACIONES WINDOWS 11',
      descripcion: 'Validación de compatibilidad de la versión 6.2 en equipos piloto antes de despliegue masivo.',
      plataforma_id: 1,
      solicitante: 'Felipe Castro',
      fecha_creacion: '2026-08-19 09:00:00',
      servicenow: 'CS0001254888',
      turno: 'T1',
      estado: 'ABIERTO',
      fecha_actualizacion: '2026-08-19 09:00:00',
      fecha_cierre: null,
      tiempo_atencion_minutos: null
    },
    {
      prioridad: 'ALTO',
      cliente_id: 6,
      asunto: 'CAMPAÑA DE PHISHING DETECTADA EN FORTIMAIL',
      descripcion: 'Ataque de suplantación bancaria masivo recibido en múltiples casillas. Se crearon reglas de bloqueo de dominios.',
      plataforma_id: 2,
      solicitante: 'Carolina Duque',
      fecha_creacion: '2026-08-16 08:15:00',
      servicenow: 'CS0001251800',
      turno: 'T1',
      estado: 'CERRADO',
      fecha_actualizacion: '2026-08-16 10:05:00',
      fecha_cierre: '2026-08-16 10:05:00',
      tiempo_atencion_minutos: 110
    }
  ];

  for (const t of ticketData) {
    const res = await db.run(
      `INSERT INTO tickets (prioridad, cliente_id, asunto, descripcion, plataforma_id, solicitante, fecha_creacion, servicenow, turno, estado, fecha_actualizacion, fecha_cierre, tiempo_atencion_minutos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.prioridad, t.cliente_id, t.asunto, t.descripcion, t.plataforma_id, t.solicitante,
        t.fecha_creacion, t.servicenow, t.turno, t.estado,
        t.fecha_actualizacion, t.fecha_cierre, t.tiempo_atencion_minutos
      ]
    );

    const ticketId = res.lastInsertRowid;
    await db.run(
      `INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_nuevo, fecha)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        'Sistema',
        'CREACION',
        `Ticket #${ticketId} registrado en el sistema.`,
        t.estado,
        t.fecha_creacion
      ]
    );

    if (t.estado !== 'ABIERTO') {
      await db.run(
        `INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_anterior, valor_nuevo, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ticketId,
          'Didier Santamaría',
          'CAMBIO_ESTADO',
          `Estado actualizado a ${t.estado}`,
          'ABIERTO',
          t.estado,
          t.fecha_actualizacion
        ]
      );
    }
  }

  console.log(`[SEED] Datos iniciales cargados exitosamente: ${ticketData.length} tickets de prueba creados.`);
}
