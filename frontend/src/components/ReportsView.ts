import { api } from '../services/api';
import { TicketFilters, Client, Platform } from '../types';

export class ReportsView {
  private container: HTMLElement;
  private filters: TicketFilters = {
    prioridad: '',
    cliente_id: '',
    plataforma_id: '',
    turno: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  private clientsList: Client[] = [];
  private platformsList: Platform[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div>
            <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Centro de Reportes y Exportación</h1>
            <p class="text-xs font-lato text-slate-500 mt-1">Generación de informes ejecutivos en formatos Excel, CSV e impresión filtrada</p>
          </div>
        </div>

        <!-- Filter parameters box -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-5">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span class="w-6 h-6 rounded-xl bg-brand-primary-light text-brand-primary font-montserrat font-bold flex items-center justify-center text-xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            </span>
            <h3 class="text-sm font-montserrat font-bold text-slate-800">Parámetros del Reporte</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-lato">
            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">Cliente</label>
              <select id="report-client" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                <option value="">Todos los clientes</option>
              </select>
            </div>

            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">Plataforma</label>
              <select id="report-platform" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                <option value="">Todas las plataformas</option>
              </select>
            </div>

            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">Estado</label>
              <select id="report-status" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                <option value="">Todos los estados</option>
                <option value="ABIERTO">ABIERTO</option>
                <option value="EN PROCESO">EN PROCESO</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="RESUELTO">RESUELTO</option>
                <option value="CERRADO">CERRADO</option>
              </select>
            </div>

            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">Prioridad</label>
              <select id="report-priority" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                <option value="">Todas</option>
                <option value="MEDIO">MEDIO</option>
                <option value="ALTO">ALTO</option>
                <option value="BAJO">BAJO</option>
                <option value="CRITICO">CRITICO</option>
              </select>
            </div>

            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">Turno</label>
              <select id="report-shift" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                <option value="">Todos</option>
                <option value="NA">NA</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T4">T4</option>
                <option value="TD">TD</option>
                <option value="TN">TN</option>
              </select>
            </div>

            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">Fecha Desde</label>
              <input type="date" id="report-from" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">Fecha Hasta</label>
              <input type="date" id="report-to" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- Download Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- 1. Excel XLSX -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 class="text-base font-montserrat font-bold text-slate-900">Libro de Excel (.xlsx)</h3>
              <p class="text-xs font-lato text-slate-500 mt-1 leading-relaxed">
                Hoja de cálculo estilizada con encabezados corporativos, ancho automático de columnas y cálculo de tiempos de atención.
              </p>
            </div>
            <a id="btn-export-excel" href="#" target="_blank" class="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-montserrat font-bold rounded-xl shadow-xs text-center transition-colors block">
              Descargar Archivo Excel
            </a>
          </div>

          <!-- 2. CSV -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div class="w-12 h-12 rounded-2xl bg-blue-100 text-brand-primary flex items-center justify-center mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              </div>
              <h3 class="text-base font-montserrat font-bold text-slate-900">Archivo CSV (.csv)</h3>
              <p class="text-xs font-lato text-slate-500 mt-1 leading-relaxed">
                Formato estándar delimitado con codificación UTF-8 BOM, compatible con Power BI, Python, R o bases de datos externas.
              </p>
            </div>
            <a id="btn-export-csv" href="#" target="_blank" class="mt-6 w-full py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-montserrat font-bold rounded-xl shadow-brand text-center transition-colors block">
              Descargar Archivo CSV
            </a>
          </div>

          <!-- 3. Impresión / PDF -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              </div>
              <h3 class="text-base font-montserrat font-bold text-slate-900">Impresión / Exportar a PDF</h3>
              <p class="text-xs font-lato text-slate-500 mt-1 leading-relaxed">
                Genera la vista limpia de impresión para guardar como PDF o imprimir reporte físico para actas de entrega y auditorías.
              </p>
            </div>
            <button id="btn-print-report" class="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-montserrat font-bold rounded-xl shadow-xs text-center transition-colors block">
              Abrir Vista de Impresión
            </button>
          </div>
        </div>
      </div>
    `;

    await this.loadSelectOptions();
    this.updateExportLinks();
    this.bindEvents();
  }

  private async loadSelectOptions(): Promise<void> {
    try {
      const [cRes, pRes] = await Promise.all([api.getClients(), api.getPlatforms()]);
      if (cRes.data) this.clientsList = cRes.data;
      if (pRes.data) this.platformsList = pRes.data;

      const cSel = this.container.querySelector('#report-client') as HTMLSelectElement;
      this.clientsList.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.text = c.nombre;
        cSel.appendChild(opt);
      });

      const pSel = this.container.querySelector('#report-platform') as HTMLSelectElement;
      this.platformsList.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.text = p.nombre;
      pSel.appendChild(opt);
      });
    } catch (e) {
      console.error(e);
    }
  }

  private updateExportLinks(): void {
    const excelBtn = this.container.querySelector('#btn-export-excel') as HTMLAnchorElement;
    const csvBtn = this.container.querySelector('#btn-export-csv') as HTMLAnchorElement;

    if (excelBtn) excelBtn.setAttribute('href', '#');
    if (csvBtn) csvBtn.setAttribute('href', '#');
  }

  private bindEvents(): void {
    const handleChange = () => {
      this.filters.cliente_id = (this.container.querySelector('#report-client') as HTMLSelectElement)?.value;
      this.filters.plataforma_id = (this.container.querySelector('#report-platform') as HTMLSelectElement)?.value;
      this.filters.estado = (this.container.querySelector('#report-status') as HTMLSelectElement)?.value;
      this.filters.prioridad = (this.container.querySelector('#report-priority') as HTMLSelectElement)?.value;
      this.filters.turno = (this.container.querySelector('#report-shift') as HTMLSelectElement)?.value;
      this.filters.fecha_desde = (this.container.querySelector('#report-from') as HTMLInputElement)?.value;
      this.filters.fecha_hasta = (this.container.querySelector('#report-to') as HTMLInputElement)?.value;
      this.updateExportLinks();
    };

    this.container.querySelectorAll('select, input').forEach((el) => {
      el.addEventListener('change', handleChange);
    });

    const handleExport = async (format: 'excel' | 'csv') => {
      try {
        await api.downloadExport(format, this.filters);
      } catch (error: any) {
        alert(error.message || 'No se pudo generar el archivo.');
      }
    };

    this.container.querySelector('#btn-export-excel')?.addEventListener('click', (event) => {
      event.preventDefault();
      void handleExport('excel');
    });

    this.container.querySelector('#btn-export-csv')?.addEventListener('click', (event) => {
      event.preventDefault();
      void handleExport('csv');
    });

    this.container.querySelector('#btn-print-report')?.addEventListener('click', () => {
      window.print();
    });
  }
}
