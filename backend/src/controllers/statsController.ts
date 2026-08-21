import { Request, Response } from 'express';
import { db } from '../services/db';
import { logger } from '../services/logger';

export async function getKPIs(req: Request, res: Response): Promise<void> {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_casos,
        SUM(CASE WHEN estado = 'ABIERTO' THEN 1 ELSE 0 END) as casos_abiertos,
        SUM(CASE WHEN estado = 'EN PROCESO' THEN 1 ELSE 0 END) as casos_en_proceso,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as casos_pendientes,
        SUM(CASE WHEN estado = 'RESUELTO' THEN 1 ELSE 0 END) as casos_resueltos,
        SUM(CASE WHEN estado = 'CERRADO' THEN 1 ELSE 0 END) as casos_cerrados,
        SUM(CASE WHEN prioridad = 'ALTO' OR prioridad = 'CRITICO' THEN 1 ELSE 0 END) as casos_prioridad_alta,
        AVG(CASE WHEN tiempo_atencion_minutos IS NOT NULL THEN tiempo_atencion_minutos ELSE NULL END) as avg_minutos
      FROM tickets
    `;

    const row = await db.get(sql);
    const avgHours = row?.avg_minutos ? (row.avg_minutos / 60).toFixed(1) : '0';

    res.json({
      success: true,
      data: {
        total_casos: Number(row?.total_casos || 0),
        casos_abiertos: Number(row?.casos_abiertos || 0),
        casos_en_proceso: Number(row?.casos_en_proceso || 0),
        casos_pendientes: Number(row?.casos_pendientes || 0),
        casos_resueltos: Number(row?.casos_resueltos || 0),
        casos_cerrados: Number(row?.casos_cerrados || 0),
        casos_prioridad_alta: Number(row?.casos_prioridad_alta || 0),
        tiempo_promedio_resolucion_horas: Number(avgHours)
      }
    });
  } catch (error: any) {
    logger.error('Error al calcular indicadores', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al calcular indicadores.', error: error.message });
  }
}

export async function getCharts(req: Request, res: Response): Promise<void> {
  try {
    const { periodo = '30d', fecha_desde, fecha_hasta } = req.query;
    const isPostgres = (process.env.DB_CLIENT || 'sqlite').toLowerCase() === 'postgres';

    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    const dateField = isPostgres ? 'CAST(t.fecha_creacion AS DATE)' : "DATE(t.fecha_creacion)";
    const monthField = isPostgres ? "TO_CHAR(t.fecha_creacion, 'YYYY-MM')" : "strftime('%Y-%m', t.fecha_creacion)";

    // Filtros de fecha según período
    if (periodo === 'hoy') {
      conditions.push(isPostgres ? `${dateField} = CURRENT_DATE` : `${dateField} = DATE('now')`);
    } else if (periodo === '7d') {
      conditions.push(isPostgres ? `${dateField} >= CURRENT_DATE - INTERVAL '7 days'` : `${dateField} >= DATE('now', '-7 days')`);
    } else if (periodo === '30d') {
      conditions.push(isPostgres ? `${dateField} >= CURRENT_DATE - INTERVAL '30 days'` : `${dateField} >= DATE('now', '-30 days')`);
    } else if (periodo === 'este_mes') {
      conditions.push(isPostgres ? `${monthField} = TO_CHAR(CURRENT_DATE, 'YYYY-MM')` : `${monthField} = strftime('%Y-%m', 'now')`);
    } else if (periodo === 'mes_anterior') {
      conditions.push(isPostgres ? `${monthField} = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')` : `${monthField} = strftime('%Y-%m', 'now', '-1 month')`);
    } else if (periodo === 'rango') {
      if (fecha_desde) {
        conditions.push(`${dateField} >= DATE(?)`);
        params.push(String(fecha_desde).trim());
      }
      if (fecha_hasta) {
        conditions.push(`${dateField} <= DATE(?)`);
        params.push(String(fecha_hasta).trim());
      }
    }

    const whereClause = conditions.join(' AND ');

    // 1. Por plataforma
    const platSql = `
      SELECT p.nombre, p.color_badge, COUNT(t.id) as cantidad
      FROM plataformas p
      LEFT JOIN tickets t ON p.id = t.plataforma_id AND ${whereClause}
      GROUP BY p.id
      ORDER BY cantidad DESC
    `;
    const byPlatform = await db.query(platSql, params);

    // 2. Por prioridad
    const prioSql = `
      SELECT t.prioridad, COUNT(t.id) as cantidad
      FROM tickets t
      WHERE ${whereClause}
      GROUP BY t.prioridad
    `;
    const byPriority = await db.query(prioSql, params);

    // 3. Por estado
    const statSql = `
      SELECT t.estado, COUNT(t.id) as cantidad
      FROM tickets t
      WHERE ${whereClause}
      GROUP BY t.estado
    `;
    const byStatus = await db.query(statSql, params);

    // 4. Por agente
    const agentSql = `
      SELECT a.nombre, COUNT(t.id) as cantidad
      FROM agentes a
      LEFT JOIN tickets t ON a.id = t.agente_id AND ${whereClause}
      GROUP BY a.id
      ORDER BY cantidad DESC
    `;
    const byAgent = await db.query(agentSql, params);

    // 5. Por cliente (Top 5)
    const clientSql = `
      SELECT c.nombre, COUNT(t.id) as cantidad
      FROM clientes c
      JOIN tickets t ON c.id = t.cliente_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY cantidad DESC
      LIMIT 6
    `;
    const byClient = await db.query(clientSql, params);

    // 6. Tendencia temporal (por día)
    const trendGroup = isPostgres ? 'CAST(t.fecha_creacion AS DATE)' : 'DATE(t.fecha_creacion)';
    const trendSql = `
      SELECT 
        ${trendGroup} as fecha,
        COUNT(t.id) as total,
        SUM(CASE WHEN t.estado = 'CERRADO' OR t.estado = 'RESUELTO' THEN 1 ELSE 0 END) as cerrados
      FROM tickets t
      WHERE ${whereClause}
      GROUP BY ${trendGroup}
      ORDER BY fecha ASC
    `;
    const trend = await db.query(trendSql, params);

    res.json({
      success: true,
      data: {
        by_platform: byPlatform,
        by_priority: byPriority,
        by_status: byStatus,
        by_agent: byAgent,
        by_client: byClient,
        trend
      }
    });
  } catch (error: any) {
    logger.error('Error al generar gráficas', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error al generar gráficas.', error: error.message });
  }
}
