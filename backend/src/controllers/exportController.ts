import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { db } from '../services/db';
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

async function getFilteredTickets(queryParams: any): Promise<any[]> {
  const {
    search,
    prioridad,
    cliente_id,
    plataforma_id,
    agente_id,
    turno,
    estado,
    fecha_desde,
    fecha_hasta,
    sort_by = 't.id',
    sort_direction = 'DESC'
  } = queryParams;

  const dateExpr = 'CAST(t.fecha_creacion AS DATE)';

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
      p.nombre LIKE ? OR
      u.nombre LIKE ?
    )`);
    params.push(term, term, term, term, term, term, term, term);
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

  if (agente_id && agente_id !== '' && agente_id !== 'all') {
    conditions.push('t.agente_id = ?');
    params.push(Number(agente_id));
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
    conditions.push(`${dateExpr} >= $1`);
    params.push(fecha_desde.trim());
  }

  if (fecha_hasta && typeof fecha_hasta === 'string' && fecha_hasta.trim() !== '') {
    conditions.push(`${dateExpr} <= $2`);
    params.push(fecha_hasta.trim());
  }

  const whereClause = conditions.join(' AND ');

  const sql = `
    SELECT
      t.id,
      t.prioridad,
      c.nombre AS cliente_nombre,
      t.asunto,
      t.descripcion,
      p.nombre AS plataforma_nombre,
      t.solicitante,
      t.fecha_creacion,
      t.servicenow,
      t.turno,
      u.nombre AS agente_nombre,
      t.estado,
      t.fecha_actualizacion,
      t.fecha_cierre,
      t.tiempo_atencion_minutos
    FROM tickets t
    JOIN clientes c ON t.cliente_id = c.id
    JOIN plataformas p ON t.plataforma_id = p.id
    LEFT JOIN usuarios u ON t.agente_id = u.id
    WHERE ${whereClause}
    ORDER BY t.id DESC
  `;

  return await db.query(sql, params);
}

export async function exportExcel(req: Request, res: Response): Promise<void> {
  try {
    const rawTickets = await getFilteredTickets(req.query);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Support Desk - Gestión de Casos';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Casos de Soporte', {
      views: [{ state: 'frozen', ySplit: 4 }]
    });

    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'MESA DE AYUDA Y GESTIÓN DE CASOS - REPORTE DETALLADO';
    titleCell.font = { name: 'Montserrat', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF19255A' }
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 32;

    worksheet.mergeCells('A2:L2');
    const subCell = worksheet.getCell('A2');
    const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    subCell.value = `Generado el: ${todayStr} | Total registros exportados: ${rawTickets.length}`;
    subCell.font = { name: 'Lato', size: 10, italic: true, color: { argb: 'FF3B4779' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    worksheet.getRow(3).height = 10;

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Prioridad', key: 'prioridad', width: 14 },
      { header: 'Cliente', key: 'cliente_nombre', width: 34 },
      { header: 'Asunto', key: 'asunto', width: 38 },
      { header: 'Plataforma', key: 'plataforma_nombre', width: 18 },
      { header: 'Solicitante', key: 'solicitante', width: 22 },
      { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 },
      { header: 'ServiceNow', key: 'servicenow', width: 18 },
      { header: 'Turno', key: 'turno', width: 10 },
      { header: 'Atendido por', key: 'agente_nombre', width: 24 },
      { header: 'Estado', key: 'estado', width: 16 },
      { header: 'Tiempo Atención', key: 'tiempo_atencion', width: 18 }
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      'ID', 'Prioridad', 'Cliente', 'Asunto', 'Plataforma', 'Solicitante',
      'Fecha Creación', 'ServiceNow', 'Turno', 'Atendido por', 'Estado', 'Tiempo Atención'
    ];
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Montserrat', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0945F7' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD7E2FF' } },
        bottom: { style: 'medium', color: { argb: 'FF19255A' } },
        left: { style: 'thin', color: { argb: 'FFD7E2FF' } },
        right: { style: 'thin', color: { argb: 'FFD7E2FF' } }
      };
    });

    rawTickets.forEach((ticket, idx) => {
      const row = worksheet.addRow({
        id: `#${String(ticket.id).padStart(4, '0')}`,
        prioridad: ticket.prioridad,
        cliente_nombre: ticket.cliente_nombre,
        asunto: ticket.asunto,
        plataforma_nombre: ticket.plataforma_nombre,
        solicitante: ticket.solicitante,
        fecha_creacion: ticket.fecha_creacion,
        servicenow: ticket.servicenow || 'N/A',
        turno: ticket.turno,
        agente_nombre: ticket.agente_nombre,
        estado: ticket.estado,
        tiempo_atencion: formatDuration(ticket.tiempo_atencion_minutos)
      });

      row.height = 22;
      const isEven = idx % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Lato', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber === 2 || colNumber === 8 || colNumber === 9 || colNumber === 11 ? 'center' : 'left' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF7F8FD' }
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_casos_support_desk_${dateStamp}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    logger.error('Error al exportar a Excel', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al exportar a Excel.', error: error.message });
  }
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  try {
    const rawTickets = await getFilteredTickets(req.query);

    const headers = [
      'ID',
      'Prioridad',
      'Cliente',
      'Asunto',
      'Descripción',
      'Plataforma',
      'Solicitante',
      'Fecha Creación',
      'ServiceNow',
      'Turno',
      'Atendido por',
      'Estado',
      'Fecha Actualización',
      'Fecha Cierre',
      'Tiempo Atención'
    ];

    const csvRows = [headers.join(';')];

    for (const t of rawTickets) {
      const cleanDesc = (t.descripcion || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
      const cleanAsunto = (t.asunto || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""');

      const values = [
        t.id,
        t.prioridad,
        `"${t.cliente_nombre}"`,
        `"${cleanAsunto}"`,
        `"${cleanDesc}"`,
        t.plataforma_nombre,
        `"${t.solicitante}"`,
        t.fecha_creacion,
        t.servicenow || '',
        t.turno,
        `"${t.agente_nombre}"`,
        t.estado,
        t.fecha_actualizacion || '',
        t.fecha_cierre || '',
        `"${formatDuration(t.tiempo_atencion_minutos)}"`
      ];
      csvRows.push(values.join(';'));
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_casos_${dateStamp}.csv"`);

    res.write('\uFEFF');
    res.write(csvRows.join('\r\n'));
    res.end();
  } catch (error: any) {
    logger.error('Error al exportar CSV', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al exportar CSV.', error: error.message });
  }
}
