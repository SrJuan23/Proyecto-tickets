import Chart from 'chart.js/auto';
import { api } from '../services/api';
import { DashboardKPIs, ChartDataResponse, Ticket } from '../types';

export class DashboardView {
  private container: HTMLElement;
  private currentPeriod: string = '30d';
  private fechaDesde: string = '';
  private fechaHasta: string = '';
  private chartInstances: Record<string, Chart> = {};
  private onViewTicket: (id: number) => void;
  private onNavigateTicketsWithFilter: (filterKey: string, filterVal: string) => void;

  constructor(
    container: HTMLElement,
    options: {
      onViewTicket: (id: number) => void;
      onNavigateTicketsWithFilter: (filterKey: string, filterVal: string) => void;
    }
  ) {
    this.container = container;
    this.onViewTicket = options.onViewTicket;
    this.onNavigateTicketsWithFilter = options.onNavigateTicketsWithFilter;
  }

  public async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        <!-- Dashboard Header & Period Filter -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div>
            <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Dashboard de Gestión</h1>
            <p class="text-xs font-lato text-slate-500 mt-1">Indicadores operativos, métricas de atención y distribución de casos en tiempo real</p>
          </div>

          <!-- Period selector tabs -->
          <div class="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/70">
            <button data-period="hoy" class="period-btn px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${this.currentPeriod === 'hoy' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">Hoy</button>
            <button data-period="7d" class="period-btn px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${this.currentPeriod === '7d' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">7 días</button>
            <button data-period="30d" class="period-btn px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${this.currentPeriod === '30d' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">30 días</button>
            <button data-period="este_mes" class="period-btn px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${this.currentPeriod === 'este_mes' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">Este mes</button>
            <button data-period="mes_anterior" class="period-btn px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${this.currentPeriod === 'mes_anterior' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">Mes anterior</button>
            <button data-period="rango" class="period-btn px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${this.currentPeriod === 'rango' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">Personalizado</button>
          </div>
        </div>

        <!-- Custom date range selector (hidden by default) -->
        <div id="custom-range-container" class="${this.currentPeriod === 'rango' ? 'flex' : 'hidden'} items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span class="text-xs font-montserrat font-semibold text-slate-700">Rango de fechas:</span>
          <input type="date" id="range-fecha-desde" value="${this.fechaDesde}" class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none" />
          <span class="text-xs text-slate-400 font-lato">hasta</span>
          <input type="date" id="range-fecha-hasta" value="${this.fechaHasta}" class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none" />
          <button id="apply-range-btn" class="px-4 py-1.5 bg-brand-dark hover:bg-brand-dark-hover text-white text-xs font-montserrat font-semibold rounded-lg transition-colors">
            Aplicar
          </button>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5" id="kpi-cards-grid">
          <!-- Skeletons while loading -->
          ${Array(7).fill(0).map(() => `
            <div class="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-card animate-pulse">
              <div class="h-3 bg-slate-100 rounded w-16 mb-2"></div>
              <div class="h-7 bg-slate-200 rounded w-12 mb-1"></div>
              <div class="h-2 bg-slate-100 rounded w-20"></div>
            </div>
          `).join('')}
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- 1. Distribución por Estado -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-montserrat font-bold text-slate-800 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
                Casos por Estado
              </h3>
              <span class="text-[11px] font-lato text-slate-400">Distribución</span>
            </div>
            <div class="relative flex-1 min-h-[220px] flex items-center justify-center">
              <canvas id="chart-status"></canvas>
            </div>
          </div>

          <!-- 2. Casos por Plataforma -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-montserrat font-bold text-slate-800 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-brand-cyan"></span>
                Casos por Plataforma
              </h3>
              <span class="text-[11px] font-lato text-slate-400">Tecnologías</span>
            </div>
            <div class="relative flex-1 min-h-[220px] flex items-center justify-center">
              <canvas id="chart-platform"></canvas>
            </div>
          </div>

          <!-- 3. Casos por Prioridad -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-montserrat font-bold text-slate-800 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Casos por Prioridad
              </h3>
              <span class="text-[11px] font-lato text-slate-400">Nivel de criticidad</span>
            </div>
            <div class="relative flex-1 min-h-[220px] flex items-center justify-center">
              <canvas id="chart-priority"></canvas>
            </div>
          </div>

          <!-- 4. Casos por Agente -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-montserrat font-bold text-slate-800 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-brand-accent1"></span>
                Carga de Trabajo por Agente de Soporte
              </h3>
              <span class="text-[11px] font-lato text-slate-400">Productividad</span>
            </div>
            <div class="relative flex-1 min-h-[220px]">
              <canvas id="chart-agent"></canvas>
            </div>
          </div>

          <!-- 5. Top Clientes -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-montserrat font-bold text-slate-800 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-brand-dark"></span>
                Top Clientes con más Solicitudes
              </h3>
              <span class="text-[11px] font-lato text-slate-400">Volumen</span>
            </div>
            <div class="relative flex-1 min-h-[220px]">
              <canvas id="chart-client"></canvas>
            </div>
          </div>

          <!-- 6. Evolución Temporal -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col lg:col-span-3">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-montserrat font-bold text-slate-800 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Tendencia y Evolución de Tickets Registrados vs Resueltos
                </h3>
                <p class="text-[11px] font-lato text-slate-400 mt-0.5">Comportamiento cronológico de la mesa de ayuda</p>
              </div>
            </div>
            <div class="relative min-h-[240px]">
              <canvas id="chart-trend"></canvas>
            </div>
          </div>
        </div>

        <!-- Recent tickets quick view -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-base font-montserrat font-bold text-slate-800">Casos Recientes Registrados</h3>
              <p class="text-xs font-lato text-slate-500">Últimos casos de soporte ingresados al sistema</p>
            </div>
            <button id="view-all-tickets-btn" class="px-3.5 py-1.5 text-xs font-montserrat font-semibold text-brand-primary hover:text-white hover:bg-brand-primary rounded-xl border border-brand-primary/30 transition-colors">
              Ver todos los casos →
            </button>
          </div>
          <div class="overflow-x-auto" id="recent-tickets-table">
            <div class="p-8 text-center text-slate-400 text-sm">Cargando casos recientes...</div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadData();
  }

  private bindEvents(): void {
    const periodButtons = this.container.querySelectorAll('.period-btn');
    const customRangeContainer = this.container.querySelector('#custom-range-container');

    periodButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-period');
        if (period) {
          this.currentPeriod = period;
          if (period === 'rango') {
            customRangeContainer?.classList.remove('hidden');
            customRangeContainer?.classList.add('flex');
          } else {
            customRangeContainer?.classList.add('hidden');
            customRangeContainer?.classList.remove('flex');
            this.render();
          }
        }
      });
    });

    const applyRangeBtn = this.container.querySelector('#apply-range-btn');
    applyRangeBtn?.addEventListener('click', () => {
      const from = (this.container.querySelector('#range-fecha-desde') as HTMLInputElement)?.value;
      const to = (this.container.querySelector('#range-fecha-hasta') as HTMLInputElement)?.value;
      this.fechaDesde = from;
      this.fechaHasta = to;
      this.render();
    });

    const viewAllBtn = this.container.querySelector('#view-all-tickets-btn');
    viewAllBtn?.addEventListener('click', () => {
      this.onNavigateTicketsWithFilter('', '');
    });
  }

  private async loadData(): Promise<void> {
    try {
      const [kpisRes, chartsRes, recentRes] = await Promise.all([
        api.getKPIs(),
        api.getCharts(this.currentPeriod, this.fechaDesde, this.fechaHasta),
        api.getTickets({ limit: 5, sort_by: 'id', sort_direction: 'DESC' })
      ]);

      if (kpisRes.data) {
        this.renderKPIs(kpisRes.data);
      }

      if (chartsRes.data) {
        this.renderCharts(chartsRes.data);
      }

      if (recentRes.data) {
        this.renderRecentTickets(recentRes.data);
      }
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    }
  }

  private renderKPIs(kpis: DashboardKPIs): void {
    const grid = this.container.querySelector('#kpi-cards-grid');
    if (!grid) return;

    const cards = [
      { label: 'Total Casos', val: kpis.total_casos, bg: 'bg-white', border: 'border-slate-200/80', text: 'text-slate-800', filterKey: '', filterVal: '', iconBg: 'bg-brand-primary-light text-brand-primary', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
      { label: 'Abiertos', val: kpis.casos_abiertos, bg: 'bg-white', border: 'border-cyan-200', text: 'text-cyan-700', filterKey: 'estado', filterVal: 'ABIERTO', iconBg: 'bg-cyan-50 text-cyan-600', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
      { label: 'En Proceso', val: kpis.casos_en_proceso, bg: 'bg-white', border: 'border-indigo-200', text: 'text-brand-primary', filterKey: 'estado', filterVal: 'EN PROCESO', iconBg: 'bg-indigo-50 text-brand-primary', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' },
      { label: 'Pendientes', val: kpis.casos_pendientes, bg: 'bg-white', border: 'border-amber-200', text: 'text-amber-700', filterKey: 'estado', filterVal: 'PENDIENTE', iconBg: 'bg-amber-50 text-amber-600', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
      { label: 'Resueltos', val: kpis.casos_resueltos, bg: 'bg-white', border: 'border-emerald-200', text: 'text-emerald-700', filterKey: 'estado', filterVal: 'RESUELTO', iconBg: 'bg-emerald-50 text-emerald-600', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
      { label: 'Cerrados', val: kpis.casos_cerrados, bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-600', filterKey: 'estado', filterVal: 'CERRADO', iconBg: 'bg-slate-100 text-slate-500', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' },
      { label: 'Prioridad Alta', val: kpis.casos_prioridad_alta, bg: 'bg-white', border: 'border-rose-200', text: 'text-rose-600', filterKey: 'prioridad', filterVal: 'ALTO', iconBg: 'bg-rose-50 text-rose-600', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>' }
    ];

    grid.innerHTML = cards
      .map(
        (c) => `
        <div 
          data-kpi-filter-key="${c.filterKey}"
          data-kpi-filter-val="${c.filterVal}"
          class="${c.bg} p-4 rounded-2xl border ${c.border} shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-montserrat font-bold text-slate-500 uppercase tracking-wider">${c.label}</span>
            <div class="w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              ${c.icon}
            </div>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-2xl font-montserrat font-extrabold ${c.text} tracking-tight">${c.val}</span>
            <span class="text-[10px] text-slate-400 group-hover:text-brand-primary transition-colors">Filtrar →</span>
          </div>
        </div>
      `
      )
      .join('');

    grid.querySelectorAll('[data-kpi-filter-key]').forEach((card) => {
      card.addEventListener('click', () => {
        const k = card.getAttribute('data-kpi-filter-key') || '';
        const v = card.getAttribute('data-kpi-filter-val') || '';
        this.onNavigateTicketsWithFilter(k, v);
      });
    });
  }

  private renderCharts(data: ChartDataResponse): void {
    // Destruir gráficos previos para evitar fugas de memoria
    Object.values(this.chartInstances).forEach((c) => c.destroy());
    this.chartInstances = {};

    // 1. Chart Status (Donut)
    const ctxStatus = (this.container.querySelector('#chart-status') as HTMLCanvasElement)?.getContext('2d');
    if (ctxStatus) {
      const statusLabels = data.by_status.map((s) => s.estado);
      const statusCounts = data.by_status.map((s) => s.cantidad);
      const statusColors: Record<string, string> = {
        'ABIERTO': '#00CDE2',
        'EN PROCESO': '#0945F7',
        'PENDIENTE': '#F59E0B',
        'RESUELTO': '#10B981',
        'CERRADO': '#94A3B8'
      };

      this.chartInstances['status'] = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusCounts,
            backgroundColor: statusLabels.map((l) => statusColors[l] || '#CBD5E1'),
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'Lato', size: 11 } } }
          }
        }
      });
    }

    // 2. Chart Platform (Bar)
    const ctxPlat = (this.container.querySelector('#chart-platform') as HTMLCanvasElement)?.getContext('2d');
    if (ctxPlat) {
      this.chartInstances['platform'] = new Chart(ctxPlat, {
        type: 'bar',
        data: {
          labels: data.by_platform.map((p) => p.nombre),
          datasets: [{
            label: 'Casos',
            data: data.by_platform.map((p) => p.cantidad),
            backgroundColor: data.by_platform.map((p) => p.color_badge || '#0945F7'),
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { stepSize: 1, font: { family: 'Lato' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 10, weight: 600 } } }
          }
        }
      });
    }

    // 3. Chart Priority (Doughnut)
    const ctxPrio = (this.container.querySelector('#chart-priority') as HTMLCanvasElement)?.getContext('2d');
    if (ctxPrio) {
      const prioColors: Record<string, string> = {
        'BAJO': '#94A3B8',
        'MEDIO': '#0945F7',
        'ALTO': '#E11D48',
        'CRITICO': '#991B1B'
      };

      this.chartInstances['priority'] = new Chart(ctxPrio, {
        type: 'pie',
        data: {
          labels: data.by_priority.map((p) => p.prioridad),
          datasets: [{
            data: data.by_priority.map((p) => p.cantidad),
            backgroundColor: data.by_priority.map((p) => prioColors[p.prioridad] || '#0945F7'),
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'Lato', size: 11 } } }
          }
        }
      });
    }

    // 4. Chart Agent (Horizontal Bar)
    const ctxAgent = (this.container.querySelector('#chart-agent') as HTMLCanvasElement)?.getContext('2d');
    if (ctxAgent) {
      this.chartInstances['agent'] = new Chart(ctxAgent, {
        type: 'bar',
        data: {
          labels: data.by_agent.map((a) => a.nombre),
          datasets: [{
            label: 'Casos Atendidos',
            data: data.by_agent.map((a) => a.cantidad),
            backgroundColor: '#5B53FF',
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { stepSize: 1, font: { family: 'Lato' } } },
            y: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 11 } } }
          }
        }
      });
    }

    // 5. Chart Client (Bar)
    const ctxClient = (this.container.querySelector('#chart-client') as HTMLCanvasElement)?.getContext('2d');
    if (ctxClient) {
      this.chartInstances['client'] = new Chart(ctxClient, {
        type: 'bar',
        data: {
          labels: data.by_client.map((c) => c.nombre.length > 15 ? c.nombre.slice(0, 15) + '...' : c.nombre),
          datasets: [{
            label: 'Total Casos',
            data: data.by_client.map((c) => c.cantidad),
            backgroundColor: '#19255A',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { stepSize: 1, font: { family: 'Lato' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Lato', size: 10 } } }
          }
        }
      });
    }

    // 6. Chart Trend (Line / Area)
    const ctxTrend = (this.container.querySelector('#chart-trend') as HTMLCanvasElement)?.getContext('2d');
    if (ctxTrend) {
      const gradientPrimary = ctxTrend.createLinearGradient(0, 0, 0, 200);
      gradientPrimary.addColorStop(0, 'rgba(9, 69, 247, 0.25)');
      gradientPrimary.addColorStop(1, 'rgba(9, 69, 247, 0.0)');

      const gradientSuccess = ctxTrend.createLinearGradient(0, 0, 0, 200);
      gradientSuccess.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      gradientSuccess.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      this.chartInstances['trend'] = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: data.trend.map((t) => t.fecha),
          datasets: [
            {
              label: 'Total Nuevos Casos',
              data: data.trend.map((t) => t.total),
              borderColor: '#0945F7',
              backgroundColor: gradientPrimary,
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 3
            },
            {
              label: 'Casos Cerrados / Resueltos',
              data: data.trend.map((t) => t.cerrados),
              borderColor: '#10B981',
              backgroundColor: gradientSuccess,
              fill: true,
              tension: 0.35,
              borderWidth: 2,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Lato', size: 12 } } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { stepSize: 1, font: { family: 'Lato' } } },
            x: { grid: { color: '#F8FAFC' }, ticks: { font: { family: 'Lato', size: 10 } } }
          }
        }
      });
    }
  }

  private renderRecentTickets(tickets: Ticket[]): void {
    const tableContainer = this.container.querySelector('#recent-tickets-table');
    if (!tableContainer) return;

    if (tickets.length === 0) {
      tableContainer.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">No hay casos registrados recientemente.</div>`;
      return;
    }

    tableContainer.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200/80 text-[11px] font-montserrat font-bold text-slate-500 uppercase tracking-wider">
            <th class="py-3 px-4">ID</th>
            <th class="py-3 px-4">Prioridad</th>
            <th class="py-3 px-4">Cliente</th>
            <th class="py-3 px-4">Asunto</th>
            <th class="py-3 px-4">Plataforma</th>
            <th class="py-3 px-4">Atendido Por</th>
            <th class="py-3 px-4">Estado</th>
            <th class="py-3 px-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-xs font-lato">
          ${tickets
            .map(
              (t) => `
            <tr class="hover:bg-brand-primary-light/30 transition-colors cursor-pointer group" data-ticket-id="${t.id}">
              <td class="py-3 px-4 font-mono font-bold text-brand-dark">#${String(t.id).padStart(4, '0')}</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-montserrat font-bold ${
                  t.prioridad === 'ALTO' || t.prioridad === 'CRITICO' ? 'badge-priority-alto' : 'badge-priority-medio'
                }">
                  ${t.prioridad}
                </span>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-800">${t.cliente_nombre || ''}</td>
              <td class="py-3 px-4 text-slate-600 max-w-xs truncate">${t.asunto}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                  ${t.plataforma_nombre || ''}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-700">${t.agente_nombre || 'NA'}</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-montserrat font-bold badge-status-${t.estado.toLowerCase().replace(/\s+/g, '-')}">
                  ${t.estado}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <button class="text-brand-primary hover:text-brand-primary-hover font-montserrat text-xs font-semibold">
                  Ver detalle →
                </button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    tableContainer.querySelectorAll('[data-ticket-id]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = Number(row.getAttribute('data-ticket-id'));
        if (id) this.onViewTicket(id);
      });
    });
  }
}
