import { Request, Response } from 'express';
import { db } from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../services/logger';

function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes < 0) return 'En progreso';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

function calculateMinutesDiff(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60)));
}

export async function getTickets(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      prioridad,
      cliente_id,
      plataforma_id,
      turno,
      estado,
      fecha_desde,
      fecha_hasta,
      sort_by = 't.id',
      sort_direction = 'DESC',
      page = 1,
      limit = 25
    } = req.query;

    const isPostgres = (process.env.DB_CLIENT || 'sqlite').toLowerCase() === 'postgres';
    const dateExpr = isPostgres ? 'CAST(t.fecha_creacion AS DATE)' : 'DATE(t.fecha_creacion)';

    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      conditions.push(`(
        CAST(t.id AS TEXT) LIKE ? OR
        c.nombre LIKE ? OR
        t.asunto LIKE ? OR
        t.descripcion LIKE ? OR
        t.solicitante LIKE ? OR
        t.servicenow LIKE ? OR
        p.nombre LIKE ?
      )`);
      params.push(term, term, term, term, term, term, term);
    }

    if (prioridad && typeof prioridad === 'string' && prioridad.trim() !== '') {
      conditions.push('t.prioridad = ?');
      params.push(prioridad.trim());
    }

    if (cliente_id && cliente_id !== '' && cliente_id !== 'all') {
      conditions.push('t.cliente_id = ?');
      params.push(Number(cliente_id));
    }

    if (plataforma_id && plataforma_id !== '' && plataforma_id !== 'all') {
      conditions.push('t.plataforma_id = ?');
      params.push(Number(plataforma_id));
    }

    if (turno && typeof turno === 'string' && turno.trim() !== '' && turno !== 'all') {
      conditions.push('t.turno = ?');
      params.push(turno.trim());
    }

    if (estado && typeof estado === 'string' && estado.trim() !== '' && estado !== 'all') {
      conditions.push('t.estado = ?');
      params.push(estado.trim());
    }

    if (fecha_desde && typeof fecha_desde === 'string' && fecha_desde.trim() !== '') {
      conditions.push(`${dateExpr} >= DATE(?)`);
      params.push(fecha_desde.trim());
    }

    if (fecha_hasta && typeof fecha_hasta === 'string' && fecha_hasta.trim() !== '') {
      conditions.push(`${dateExpr} <= DATE(?)`);
      params.push(fecha_hasta.trim());
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `
      SELECT COUNT(*) as total
      FROM tickets t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN plataformas p ON t.plataforma_id = p.id
      WHERE ${whereClause}
    `;
    const countRes = await db.get(countSql, params);
    const total = countRes?.total || 0;

    const allowedSortCols: Record<string, string> = {
      'id': 't.id',
      'prioridad': 't.prioridad',
      'cliente': 'c.nombre',
      'asunto': 't.asunto',
      'plataforma': 'p.nombre',
      'solicitante': 't.solicitante',
      'fecha_creacion': 't.fecha_creacion',
      'servicenow': 't.servicenow',
      'turno': 't.turno',
      'estado': 't.estado'
    };

    const sortByParam = String(sort_by).toLowerCase();
    const resolvedSortBy = allowedSortCols[sortByParam] || 't.id';
    const resolvedDirection = String(sort_direction).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 25));
    const offset = (pageNum - 1) * limitNum;

    const listSql = `
      SELECT
        t.id,
        t.prioridad,
        t.cliente_id,
        c.nombre AS cliente_nombre,
        t.asunto,
        t.descripcion,
        t.plataforma_id,
        p.nombre AS plataforma_nombre,
        p.color_badge AS plataforma_color,
        t.solicitante,
        t.fecha_creacion,
        t.servicenow,
        t.turno,
        t.estado,
        t.fecha_actualizacion,
        t.fecha_cierre,
        t.tiempo_atencion_minutos
      FROM tickets t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN plataformas p ON t.plataforma_id = p.id
      WHERE ${whereClause}
      ORDER BY ${resolvedSortBy} ${resolvedDirection}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const rawTickets = await db.query(listSql, params);

    const tickets = rawTickets.map((t: any) => ({
      ...t,
      tiempo_atencion_formateado: formatDuration(t.tiempo_atencion_minutos)
    }));

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    logger.error('Error al consultar casos', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al consultar casos.', error: error.message });
  }
}

export async function getTicketById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        t.id,
        t.prioridad,
        t.cliente_id,
        c.nombre AS cliente_nombre,
        c.nit AS cliente_nit,
        c.contacto_principal AS cliente_contacto,
        c.correo_contacto AS cliente_correo,
        t.asunto,
        t.descripcion,
        t.plataforma_id,
        p.nombre AS plataforma_nombre,
        p.color_badge AS plataforma_color,
        p.descripcion AS plataforma_descripcion,
        t.solicitante,
        t.fecha_creacion,
        t.servicenow,
        t.turno,
        t.estado,
        t.fecha_actualizacion,
        t.fecha_cierre,
        t.tiempo_atencion_minutos
      FROM tickets t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN plataformas p ON t.plataforma_id = p.id
      WHERE t.id = ?
    `;

    const ticket = await db.get(sql, [id]);

    if (!ticket) {
      res.status(404).json({ success: false, message: `Caso #${id} no encontrado.` });
      return;
    }

    const historySql = `
      SELECT id, ticket_id, usuario_nombre, accion, descripcion, valor_anterior, valor_nuevo, fecha
      FROM historial_ticket
      WHERE ticket_id = ?
      ORDER BY fecha DESC, id DESC
    `;
    const history = await db.query(historySql, [id]);

    const snConfig = await db.get("SELECT valor FROM configuracion WHERE clave = 'SERVICENOW_BASE_URL'");
    const servicenowBaseUrl = snConfig?.valor || '';

    res.json({
      success: true,
      data: {
        ...ticket,
        tiempo_atencion_formateado: formatDuration(ticket.tiempo_atencion_minutos),
        historial: history,
        servicenow_full_url: ticket.servicenow && servicenowBaseUrl ? `${servicenowBaseUrl}${ticket.servicenow}` : null
      }
    });
  } catch (error: any) {
    logger.error('Error al obtener detalle del caso', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al obtener detalle del caso.', error: error.message });
  }
}

export async function createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      prioridad = 'MEDIO',
      cliente_id,
      asunto,
      descripcion,
      plataforma_id,
      solicitante,
      fecha_creacion,
      servicenow,
      turno = 'NA',
      estado = 'ABIERTO'
    } = req.body;

    if (!cliente_id) {
      res.status(400).json({ success: false, message: 'El cliente es obligatorio.' });
      return;
    }
    if (!asunto || !asunto.trim()) {
      res.status(400).json({ success: false, message: 'El asunto del correo es obligatorio.' });
      return;
    }
    if (!descripcion || !descripcion.trim()) {
      res.status(400).json({ success: false, message: 'La descripción del caso es obligatoria.' });
      return;
    }
    if (!plataforma_id) {
      res.status(400).json({ success: false, message: 'La plataforma tecnológica es obligatoria.' });
      return;
    }
    if (!solicitante || !solicitante.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del solicitante es obligatorio.' });
      return;
    }

    const creationDate = (fecha_creacion && typeof fecha_creacion === 'string' && fecha_creacion.trim())
      ? fecha_creacion.trim()
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

    const isClosed = estado === 'CERRADO';
    const closeDate = isClosed ? creationDate : null;
    const attentionMins = isClosed ? 0 : null;

    const result = await db.run(
      `INSERT INTO tickets
        (prioridad, cliente_id, asunto, descripcion, plataforma_id, solicitante, fecha_creacion, servicenow, turno, estado, fecha_actualizacion, fecha_cierre, tiempo_atencion_minutos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prioridad,
        cliente_id,
        asunto.trim(),
        descripcion.trim(),
        plataforma_id,
        solicitante.trim(),
        creationDate,
        servicenow ? servicenow.trim() : null,
        turno || 'NA',
        estado || 'ABIERTO',
        creationDate,
        closeDate,
        attentionMins
      ]
    );

    const ticketId = result.lastInsertRowid;
    const actorName = req.user?.nombre || 'Agente de Soporte';

    await db.run(
      `INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_nuevo, fecha)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        actorName,
        'CREACION',
        `Caso #${ticketId} creado exitosamente con prioridad ${prioridad} y estado ${estado}.`,
        estado,
        creationDate
      ]
    );

    res.status(201).json({
      success: true,
      message: `Caso #${ticketId} creado correctamente.`,
      data: { id: ticketId }
    });
  } catch (error: any) {
    logger.error('Error al registrar nuevo caso', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al registrar nuevo caso.', error: error.message });
  }
}

export async function updateTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      prioridad,
      cliente_id,
      asunto,
      descripcion,
      plataforma_id,
      solicitante,
      servicenow,
      turno,
      estado,
      fecha_creacion
    } = req.body;

    const existing = await db.get('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ success: false, message: `Caso #${id} no encontrado.` });
      return;
    }

    const actorName = req.user?.nombre || 'Agente de Soporte';
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let newFechaCierre = existing.fecha_cierre;
    let newTiempoMinutos = existing.tiempo_atencion_minutos;

    if (estado && estado === 'CERRADO' && existing.estado !== 'CERRADO') {
      newFechaCierre = now;
      newTiempoMinutos = calculateMinutesDiff(existing.fecha_creacion, now);
    } else if (estado && estado !== 'CERRADO' && existing.estado === 'CERRADO') {
      newFechaCierre = null;
      newTiempoMinutos = null;
    }

    const updatedPrioridad = prioridad || existing.prioridad;
    const updatedClienteId = cliente_id || existing.cliente_id;
    const updatedAsunto = asunto !== undefined ? asunto.trim() : existing.asunto;
    const updatedDescripcion = descripcion !== undefined ? descripcion.trim() : existing.descripcion;
    const updatedPlataformaId = plataforma_id || existing.plataforma_id;
    const updatedSolicitante = solicitante !== undefined ? solicitante.trim() : existing.solicitante;
    const updatedServiceNow = servicenow !== undefined ? (servicenow ? servicenow.trim() : null) : existing.servicenow;
    const updatedTurno = turno || existing.turno;
    const updatedEstado = estado || existing.estado;
    const updatedFechaCreacion = (req.user?.rol === 'ADMIN' && fecha_creacion) ? fecha_creacion : existing.fecha_creacion;

    await db.run(
      `UPDATE tickets SET
        prioridad = ?,
        cliente_id = ?,
        asunto = ?,
        descripcion = ?,
        plataforma_id = ?,
        solicitante = ?,
        servicenow = ?,
        turno = ?,
        estado = ?,
        fecha_creacion = ?,
        fecha_actualizacion = ?,
        fecha_cierre = ?,
        tiempo_atencion_minutos = ?
       WHERE id = ?`,
      [
        updatedPrioridad,
        updatedClienteId,
        updatedAsunto,
        updatedDescripcion,
        updatedPlataformaId,
        updatedSolicitante,
        updatedServiceNow,
        updatedTurno,
        updatedEstado,
        updatedFechaCreacion,
        now,
        newFechaCierre,
        newTiempoMinutos,
        id
      ]
    );

    if (existing.estado !== updatedEstado) {
      await db.run(
        `INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_anterior, valor_nuevo, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, actorName, 'CAMBIO_ESTADO', `Estado cambiado de ${existing.estado} a ${updatedEstado}`, existing.estado, updatedEstado, now]
      );
    }

    if (existing.prioridad !== updatedPrioridad) {
      await db.run(
        `INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_anterior, valor_nuevo, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, actorName, 'CAMBIO_PRIORIDAD', `Prioridad modificada de ${existing.prioridad} a ${updatedPrioridad}`, existing.prioridad, updatedPrioridad, now]
      );
    }

    await db.run(
      `INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, fecha)
       VALUES (?, ?, ?, ?, ?)`,
      [id, actorName, 'EDICION', 'Información del caso actualizada.', now]
    );

    res.json({
      success: true,
      message: `Caso #${id} actualizado correctamente.`
    });
  } catch (error: any) {
    logger.error('Error al actualizar el caso', { ticketId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al actualizar el caso.', error: error.message });
  }
}

export async function changeTicketStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      res.status(400).json({ success: false, message: 'Debe especificar el nuevo estado.' });
      return;
    }

    const existing = await db.get('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ success: false, message: `Caso #${id} no encontrado.` });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let newFechaCierre = existing.fecha_cierre;
    let newTiempoMinutos = existing.tiempo_atencion_minutos;

    if (estado === 'CERRADO' && existing.estado !== 'CERRADO') {
      newFechaCierre = now;
      newTiempoMinutos = calculateMinutesDiff(existing.fecha_creacion, now);
    } else if (estado !== 'CERRADO' && existing.estado === 'CERRADO') {
      newFechaCierre = null;
      newTiempoMinutos = null;
    }

    await db.run(
      `UPDATE tickets SET estado = ?, fecha_actualizacion = ?, fecha_cierre = ?, tiempo_atencion_minutos = ? WHERE id = ?`,
      [estado, now, newFechaCierre, newTiempoMinutos, id]
    );

    const actorName = req.user?.nombre || 'Agente de Soporte';
    await db.run(
      `INSERT INTO historial_ticket (ticket_id, usuario_nombre, accion, descripcion, valor_anterior, valor_nuevo, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, actorName, 'CAMBIO_ESTADO', `Estado actualizado de ${existing.estado} a ${estado}`, existing.estado, estado, now]
    );

    res.json({
      success: true,
      message: `Estado del caso #${id} actualizado a ${estado}.`
    });
  } catch (error: any) {
    logger.error('Error al cambiar estado', { ticketId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al cambiar estado.', error: error.message });
  }
}

export async function deleteTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT id FROM tickets WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ success: false, message: `Caso #${id} no encontrado.` });
      return;
    }

    await db.run('DELETE FROM historial_ticket WHERE ticket_id = ?', [id]);
    await db.run('DELETE FROM tickets WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Caso #${id} eliminado correctamente.`
    });
  } catch (error: any) {
    logger.error('Error al eliminar el caso', { ticketId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al eliminar el caso.', error: error.message });
  }
}
