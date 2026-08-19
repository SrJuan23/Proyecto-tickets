import { api } from '../services/api';
import { toast } from '../services/toast';
import { Ticket, TicketFilters, Pagination, Client, Platform, Agent } from '../types';

export class TicketsView {
  private container: HTMLElement;
  private filters: TicketFilters = {
    search: '',
    prioridad: '',
    cliente_id: '',
    plataforma_id: '',
    agente_id: '',
    turno: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    sort_by: 'id',
    sort_direction: 'DESC',
    page: 1,
    limit: 25
  };

  private tickets: Ticket[] = [];
  private pagination: Pagination = { total: 0, page: 1, limit: 25, totalPages: 1 };
  private clientsList: Client[] = [];
  private platformsList: Platform[] = [];
  private agentsList: Agent[] = [];
  private isFiltersOpen = false;

  private onOpenNewTicket: () => void;
  private onOpenEditTicket: (ticket: Ticket) => void;
  private onViewTicketDetail: (ticketId: number) => void;

  constructor(
    container: HTMLElement,
    options: {
      onOpenNewTicket: () => void;
      onOpenEditTicket: (ticket: Ticket) => void;
      onViewTicketDetail: (ticketId: number) => void;
      initialFilter?: { key: string; val: string };
    }
  ) {
    this.container = container;
    this.onOpenNewTicket = options.onOpenNewTicket;
    this.onOpenEditTicket = options.onOpenEditTicket;
    this.onViewTicketDetail = options.onViewTicketDetail;

    if (options.initialFilter && options.initialFilter.key) {
      (this.filters as any)[options.initialFilter.key] = options.initialFilter.val;
      if (options.initialFilter.key !== 'search') {
        this.isFiltersOpen = true;
      }
    }
  }

  public setFilter(key: string, val: string): void {
    (this.filters as any)[key] = val;
    this.filters.page = 1;
    this.render();
  }

  public async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-12">
        <!-- Header & Action toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Registro de Casos</h1>
              <span id="ticket-total-badge" class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-primary-light text-brand-primary">
                ${this.pagination.total} casos
              </span>
            </div>
            <p class="text-xs font-lato text-slate-500 mt-1">Gestión centralizada, seguimiento de SLA y atención de tickets de soporte técnico</p>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap">
            <!-- Export dropdown trigger -->
            <div class="relative" id="export-dropdown-wrapper">
              <button 
                id="export-menu-btn"
                class="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-montserrat font-semibold text-slate-700 flex items-center gap-2 transition-colors shadow-xs"
              >
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                <span>Exportar</span>
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              <div id="export-dropdown-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-modal border border-slate-100 py-1.5 z-40 animate-fade-in">
                <a id="export-excel-link" href="#" target="_blank" class="w-full text-left px-4 py-2 text-xs font-lato text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span>Exportar a Excel (.xlsx)</span>
                </a>
                <a id="export-csv-link" href="#" target="_blank" class="w-full text-left px-4 py-2 text-xs font-lato text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  <span>Exportar a CSV (.csv)</span>
                </a>
                <button id="print-view-btn" class="w-full text-left px-4 py-2 text-xs font-lato text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 border-t border-slate-100">
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  <span>Vista de Impresión</span>
                </button>
              </div>
            </div>

            <!-- New Ticket CTA -->
            <button 
              id="new-ticket-btn"
              class="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat text-xs font-semibold rounded-xl shadow-brand transition-all flex items-center gap-2 transform active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
              <span>+ Nuevo caso</span>
            </button>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card space-y-4">
          <div class="flex flex-col md:flex-row items-center gap-3">
            <!-- Search bar -->
            <div class="relative flex-1 w-full">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" 
                id="ticket-search-input"
                value="${this.filters.search || ''}"
                placeholder="Buscar caso por ID, cliente, asunto, solicitante, ServiceNow, agente..." 
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-lato text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all"
              />
            </div>

            <!-- Toggle advanced filters button -->
            <button 
              id="toggle-filters-btn"
              class="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-montserrat font-semibold flex items-center justify-center gap-2 border transition-all ${
                this.isFiltersOpen || this.hasActiveFilters()
                  ? 'bg-brand-primary-light text-brand-primary border-brand-primary/40'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              <span>Filtros Avanzados</span>
              ${this.getActiveFiltersCount() > 0 ? `<span class="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] flex items-center justify-center font-bold font-mono">${this.getActiveFiltersCount()}</span>` : ''}
            </button>

            <!-- Reset all filters button -->
            ${
              this.hasActiveFilters()
                ? `
                <button 
                  id="clear-all-filters-btn"
                  class="w-full md:w-auto px-3.5 py-2 text-xs font-montserrat font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  <span>Limpiar filtros</span>
                </button>
                `
                : ''
            }
          </div>

          <!-- Advanced Filters Panel (Collapsible) -->
          <div id="advanced-filters-panel" class="${this.isFiltersOpen ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-100">
            <!-- 1. Prioridad -->
            <div>
              <label class="block text-[11px] font-montserrat font-semibold text-slate-600 mb-1">Prioridad</label>
              <select id="filter-prioridad" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-lato focus:ring-1 focus:ring-brand-primary focus:outline-none">
                <option value="">Todas</option>
                <option value="MEDIO" ${this.filters.prioridad === 'MEDIO' ? 'selected' : ''}>MEDIO</option>
                <option value="ALTO" ${this.filters.prioridad === 'ALTO' ? 'selected' : ''}>ALTO</option>
                <option value="BAJO" ${this.filters.prioridad === 'BAJO' ? 'selected' : ''}>BAJO</option>
                <option value="CRITICO" ${this.filters.prioridad === 'CRITICO' ? 'selected' : ''}>CRITICO</option>
              </select>
            </div>

            <!-- 2. Estado -->
            <div>
              <label class="block text-[11px] font-montserrat font-semibold text-slate-600 mb-1">Estado</label>
              <select id="filter-estado" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-lato focus:ring-1 focus:ring-brand-primary focus:outline-none">
                <option value="">Todos</option>
                <option value="ABIERTO" ${this.filters.estado === 'ABIERTO' ? 'selected' : ''}>ABIERTO</option>
                <option value="EN PROCESO" ${this.filters.estado === 'EN PROCESO' ? 'selected' : ''}>EN PROCESO</option>
                <option value="PENDIENTE" ${this.filters.estado === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                <option value="RESUELTO" ${this.filters.estado === 'RESUELTO' ? 'selected' : ''}>RESUELTO</option>
                <option value="CERRADO" ${this.filters.estado === 'CERRADO' ? 'selected' : ''}>CERRADO</option>
              </select>
            </div>

            <!-- 3. Plataforma -->
            <div>
              <label class="block text-[11px] font-montserrat font-semibold text-slate-600 mb-1">Plataforma</label>
              <select id="filter-plataforma" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-lato focus:ring-1 focus:ring-brand-primary focus:outline-none">
                <option value="">Todas</option>
                ${this.platformsList
                  .map((p) => `<option value="${p.id}" ${String(this.filters.plataforma_id) === String(p.id) ? 'selected' : ''}>${p.nombre}</option>`)
                  .join('')}
              </select>
            </div>

            <!-- 4. Turno -->
            <div>
              <label class="block text-[11px] font-montserrat font-semibold text-slate-600 mb-1">Turno</label>
              <select id="filter-turno" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-lato focus:ring-1 focus:ring-brand-primary focus:outline-none">
                <option value="">Todos</option>
                <option value="NA" ${this.filters.turno === 'NA' ? 'selected' : ''}>NA</option>
                <option value="T1" ${this.filters.turno === 'T1' ? 'selected' : ''}>T1</option>
                <option value="T2" ${this.filters.turno === 'T2' ? 'selected' : ''}>T2</option>
                <option value="T4" ${this.filters.turno === 'T4' ? 'selected' : ''}>T4</option>
                <option value="TD" ${this.filters.turno === 'TD' ? 'selected' : ''}>TD</option>
                <option value="TN" ${this.filters.turno === 'TN' ? 'selected' : ''}>TN</option>
              </select>
            </div>

            <!-- 5. Cliente -->
            <div>
              <label class="block text-[11px] font-montserrat font-semibold text-slate-600 mb-1">Cliente</label>
              <select id="filter-cliente" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-lato focus:ring-1 focus:ring-brand-primary focus:outline-none">
                <option value="">Todos los clientes</option>
                ${this.clientsList
                  .map((c) => `<option value="${c.id}" ${String(this.filters.cliente_id) === String(c.id) ? 'selected' : ''}>${c.nombre}</option>`)
                  .join('')}
              </select>
            </div>

            <!-- 6. Agente -->
            <div>
              <label class="block text-[11px] font-montserrat font-semibold text-slate-600 mb-1">Atendido por</label>
              <select id="filter-agente" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-lato focus:ring-1 focus:ring-brand-primary focus:outline-none">
                <option value="">Todos los agentes</option>
                ${this.agentsList
                  .map((a) => `<option value="${a.id}" ${String(this.filters.agente_id) === String(a.id) ? 'selected' : ''}>${a.nombre}</option>`)
                  .join('')}
              </select>
            </div>

            <!-- 7. Rango Fechas -->
            <div>
              <label class="block text-[11px] font-montserrat font-semibold text-slate-600 mb-1">Fecha Desde / Hasta</label>
              <div class="flex items-center gap-1">
                <input type="date" id="filter-fecha-desde" value="${this.filters.fecha_desde || ''}" class="w-1/2 px-1.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none" />
                <input type="date" id="filter-fecha-hasta" value="${this.filters.fecha_hasta || ''}" class="w-1/2 px-1.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none" />
              </div>
            </div>
          </div>

          <!-- Active filters pill chips -->
          ${this.renderActiveFilterChips()}
        </div>

        <!-- Tickets Data Table Container -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="overflow-x-auto min-h-[300px]" id="tickets-table-body-container">
            <!-- Table rendered here -->
            <div class="p-12 text-center text-slate-400 text-sm">Cargando lista de casos...</div>
          </div>

          <!-- Pagination Footer -->
          <div id="tickets-pagination-footer" class="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <!-- Pagination text and limit selector -->
          </div>
        </div>
      </div>
    `;

    this.bindDOMEvents();
    await this.fetchAuxiliaryData();
    await this.fetchTickets();
  }

  private hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.prioridad ||
      this.filters.cliente_id ||
      this.filters.plataforma_id ||
      this.filters.agente_id ||
      this.filters.turno ||
      this.filters.estado ||
      this.filters.fecha_desde ||
      this.filters.fecha_hasta
    );
  }

  private getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.prioridad) count++;
    if (this.filters.cliente_id) count++;
    if (this.filters.plataforma_id) count++;
    if (this.filters.agente_id) count++;
    if (this.filters.turno) count++;
    if (this.filters.estado) count++;
    if (this.filters.fecha_desde || this.filters.fecha_hasta) count++;
    return count;
  }

  private renderActiveFilterChips(): string {
    if (!this.hasActiveFilters()) return '';

    const chips: Array<{ label: string; key: string }> = [];

    if (this.filters.search) chips.push({ label: `Búsqueda: "${this.filters.search}"`, key: 'search' });
    if (this.filters.prioridad) chips.push({ label: `Prioridad: ${this.filters.prioridad}`, key: 'prioridad' });
    if (this.filters.estado) chips.push({ label: `Estado: ${this.filters.estado}`, key: 'estado' });
    if (this.filters.turno) chips.push({ label: `Turno: ${this.filters.turno}`, key: 'turno' });

    if (this.filters.cliente_id) {
      const c = this.clientsList.find((item) => String(item.id) === String(this.filters.cliente_id));
      chips.push({ label: `Cliente: ${c?.nombre || this.filters.cliente_id}`, key: 'cliente_id' });
    }

    if (this.filters.plataforma_id) {
      const p = this.platformsList.find((item) => String(item.id) === String(this.filters.plataforma_id));
      chips.push({ label: `Plataforma: ${p?.nombre || this.filters.plataforma_id}`, key: 'plataforma_id' });
    }

    if (this.filters.agente_id) {
      const a = this.agentsList.find((item) => String(item.id) === String(this.filters.agente_id));
      chips.push({ label: `Agente: ${a?.nombre || this.filters.agente_id}`, key: 'agente_id' });
    }

    if (this.filters.fecha_desde || this.filters.fecha_hasta) {
      chips.push({ label: `Fechas: ${this.filters.fecha_desde || '...'} a ${this.filters.fecha_hasta || '...'}`, key: 'fechas' });
    }

    return `
      <div class="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
        <span class="text-slate-400 font-montserrat text-[11px] font-semibold">Filtros activos:</span>
        ${chips
          .map(
            (c) => `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-lato text-xs border border-slate-200">
            <span>${c.label}</span>
            <button data-remove-filter="${c.key}" class="text-slate-400 hover:text-rose-600 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </span>
        `
          )
          .join('')}
      </div>
    `;
  }

  private async fetchAuxiliaryData(): Promise<void> {
    try {
      if (this.clientsList.length === 0 || this.platformsList.length === 0 || this.agentsList.length === 0) {
        const [cRes, pRes, aRes] = await Promise.all([
          api.getClients(),
          api.getPlatforms(),
          api.getAgents()
        ]);
        if (cRes.data) this.clientsList = cRes.data;
        if (pRes.data) this.platformsList = pRes.data;
        if (aRes.data) this.agentsList = aRes.data;

        // Re-render filter dropdowns options if loaded
        this.updateFilterDropdownOptions();
      }
    } catch (err) {
      console.error('Error fetching auxiliary data:', err);
    }
  }

  private updateFilterDropdownOptions(): void {
    const platSelect = this.container.querySelector('#filter-plataforma') as HTMLSelectElement;
    if (platSelect && platSelect.options.length <= 1) {
      this.platformsList.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.text = p.nombre;
        if (String(this.filters.plataforma_id) === String(p.id)) opt.selected = true;
        platSelect.appendChild(opt);
      });
    }

    const clientSelect = this.container.querySelector('#filter-cliente') as HTMLSelectElement;
    if (clientSelect && clientSelect.options.length <= 1) {
      this.clientsList.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.text = c.nombre;
        if (String(this.filters.cliente_id) === String(c.id)) opt.selected = true;
        clientSelect.appendChild(opt);
      });
    }

    const agentSelect = this.container.querySelector('#filter-agente') as HTMLSelectElement;
    if (agentSelect && agentSelect.options.length <= 1) {
      this.agentsList.forEach((a) => {
        const opt = document.createElement('option');
        opt.value = String(a.id);
        opt.text = a.nombre;
        if (String(this.filters.agente_id) === String(a.id)) opt.selected = true;
        agentSelect.appendChild(opt);
      });
    }
  }

  private async fetchTickets(): Promise<void> {
    const tableContainer = this.container.querySelector('#tickets-table-body-container');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div class="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-montserrat text-slate-500 font-semibold">Consultando base de casos...</span>
        </div>
      `;
    }

    try {
      const res = await api.getTickets(this.filters);
      if (res.data) {
        this.tickets = res.data;
        if (res.pagination) {
          this.pagination = res.pagination;
        }
        this.renderTable();
        this.renderPaginationFooter();

        // Update total badge
        const badge = this.container.querySelector('#ticket-total-badge');
        if (badge) badge.textContent = `${this.pagination.total} casos`;

        // Update export links with current filter params
        const excelLink = this.container.querySelector('#export-excel-link') as HTMLAnchorElement;
        const csvLink = this.container.querySelector('#export-csv-link') as HTMLAnchorElement;
        if (excelLink) excelLink.href = api.getExportUrl('excel', this.filters);
        if (csvLink) csvLink.href = api.getExportUrl('csv', this.filters);
      }
    } catch (err: any) {
      if (tableContainer) {
        tableContainer.innerHTML = `
          <div class="p-12 text-center text-rose-500 text-sm">
            <p class="font-montserrat font-bold">Error al cargar casos</p>
            <p class="font-lato text-xs mt-1 text-slate-500">${err.message || 'Verifique la conexión con el servidor.'}</p>
          </div>
        `;
      }
    }
  }

  private renderTable(): void {
    const tableContainer = this.container.querySelector('#tickets-table-body-container');
    if (!tableContainer) return;

    if (this.tickets.length === 0) {
      tableContainer.innerHTML = `
        <div class="py-16 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center shadow-xs">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p class="text-base font-montserrat font-bold text-slate-800">No encontramos casos con los filtros seleccionados</p>
          <p class="text-xs font-lato text-slate-500 max-w-sm">Prueba ajustando los criterios de búsqueda, cambiando las fechas o limpiando los filtros activos.</p>
          ${
            this.hasActiveFilters()
              ? `<button id="empty-state-clear-btn" class="mt-2 px-4 py-2 bg-brand-primary text-white text-xs font-montserrat font-semibold rounded-xl shadow-brand transition-all">Limpiar filtros de búsqueda</button>`
              : `<button id="empty-state-new-btn" class="mt-2 px-4 py-2 bg-brand-primary text-white text-xs font-montserrat font-semibold rounded-xl shadow-brand transition-all">+ Registrar primer caso</button>`
          }
        </div>
      `;

      this.container.querySelector('#empty-state-clear-btn')?.addEventListener('click', () => {
        this.clearAllFilters();
      });

      this.container.querySelector('#empty-state-new-btn')?.addEventListener('click', () => {
        this.onOpenNewTicket();
      });

      return;
    }

    tableContainer.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200/80 text-[11px] font-montserrat font-bold text-slate-600 uppercase tracking-wider select-none">
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="id">
              <div class="flex items-center gap-1.5">
                <span>ID</span>
                ${this.getSortIcon('id')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="prioridad">
              <div class="flex items-center gap-1.5">
                <span>Prioridad</span>
                ${this.getSortIcon('prioridad')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors min-w-[180px]" data-sort="cliente">
              <div class="flex items-center gap-1.5">
                <span>Cliente</span>
                ${this.getSortIcon('cliente')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors min-w-[220px]" data-sort="asunto">
              <div class="flex items-center gap-1.5">
                <span>Asunto del Correo</span>
                ${this.getSortIcon('asunto')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="plataforma">
              <div class="flex items-center gap-1.5">
                <span>Plataforma</span>
                ${this.getSortIcon('plataforma')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="solicitante">
              <div class="flex items-center gap-1.5">
                <span>Solicitante</span>
                ${this.getSortIcon('solicitante')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="fecha_creacion">
              <div class="flex items-center gap-1.5">
                <span>Fecha</span>
                ${this.getSortIcon('fecha_creacion')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="servicenow">
              <div class="flex items-center gap-1.5">
                <span>ServiceNow</span>
                ${this.getSortIcon('servicenow')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="turno">
              <div class="flex items-center gap-1.5">
                <span>Turno</span>
                ${this.getSortIcon('turno')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="agente">
              <div class="flex items-center gap-1.5">
                <span>Atendido por</span>
                ${this.getSortIcon('agente')}
              </div>
            </th>
            <th class="py-3.5 px-4 cursor-pointer hover:text-brand-primary transition-colors" data-sort="estado">
              <div class="flex items-center gap-1.5">
                <span>Estado</span>
                ${this.getSortIcon('estado')}
              </div>
            </th>
            <th class="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-xs font-lato text-slate-700">
          ${this.tickets
            .map((t) => {
              const formattedDate = this.formatDateColombian(t.fecha_creacion);
              return `
              <tr class="hover:bg-brand-primary-light/40 transition-colors group cursor-pointer" data-row-ticket-id="${t.id}">
                <!-- ID -->
                <td class="py-3.5 px-4 font-mono font-bold text-brand-dark">
                  #${String(t.id).padStart(4, '0')}
                </td>

                <!-- Prioridad -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-montserrat font-bold ${
                    t.prioridad === 'ALTO' || t.prioridad === 'CRITICO' ? 'badge-priority-alto' : 'badge-priority-medio'
                  }">
                    ${t.prioridad}
                  </span>
                </td>

                <!-- Cliente -->
                <td class="py-3.5 px-4 font-semibold text-slate-900 leading-snug">
                  ${t.cliente_nombre || ''}
                </td>

                <!-- Asunto con descripción resumida -->
                <td class="py-3.5 px-4 max-w-xs">
                  <div class="font-medium text-slate-800 truncate" title="${t.asunto}">${t.asunto}</div>
                  <div class="text-[11px] text-slate-400 truncate mt-0.5" title="${t.descripcion}">${t.descripcion}</div>
                </td>

                <!-- Plataforma -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs">
                    ${t.plataforma_nombre || ''}
                  </span>
                </td>

                <!-- Solicitante -->
                <td class="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                  ${t.solicitante}
                </td>

                <!-- Fecha -->
                <td class="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                  ${formattedDate}
                </td>

                <!-- ServiceNow with quick copy -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  ${
                    t.servicenow
                      ? `
                      <div class="flex items-center gap-1.5 group/sn">
                        <span class="font-mono text-xs font-semibold text-brand-dark bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          ${t.servicenow}
                        </span>
                        <button 
                          data-copy-sn="${t.servicenow}" 
                          class="p-1 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded transition-colors" 
                          title="Copiar ServiceNow ID"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                      </div>
                    `
                      : '<span class="text-slate-300 font-mono">-</span>'
                  }
                </td>

                <!-- Turno -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-brand-primary-light text-brand-primary">
                    ${t.turno}
                  </span>
                </td>

                <!-- Atendido por -->
                <td class="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                  ${t.agente_nombre || 'NA'}
                </td>

                <!-- Estado -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-montserrat font-bold badge-status-${t.estado.toLowerCase().replace(/\s+/g, '-')}">
                    ${t.estado}
                  </span>
                </td>

                <!-- Acciones Rápidas -->
                <td class="py-3.5 px-4 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                  <div class="flex items-center justify-end gap-1">
                    <button 
                      data-action-view="${t.id}"
                      class="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-white rounded-lg transition-colors shadow-2xs"
                      title="Ver detalle"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </button>
                    <button 
                      data-action-edit="${t.id}"
                      class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors shadow-2xs"
                      title="Editar caso"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button 
                      data-action-status="${t.id}"
                      class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors shadow-2xs"
                      title="Cambiar estado"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    `;

    // Row click -> View ticket detail
    tableContainer.querySelectorAll('[data-row-ticket-id]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = Number(row.getAttribute('data-row-ticket-id'));
        if (id) this.onViewTicketDetail(id);
      });
    });

    // Action button clicks
    tableContainer.querySelectorAll('[data-action-view]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-action-view'));
        if (id) this.onViewTicketDetail(id);
      });
    });

    tableContainer.querySelectorAll('[data-action-edit]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-action-edit'));
        const ticket = this.tickets.find((t) => t.id === id);
        if (ticket) this.onOpenEditTicket(ticket);
      });
    });

    tableContainer.querySelectorAll('[data-action-status]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-action-status'));
        this.openQuickStatusModal(id);
      });
    });

    tableContainer.querySelectorAll('[data-copy-sn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sn = btn.getAttribute('data-copy-sn');
        if (sn) {
          navigator.clipboard.writeText(sn);
          toast.success(`ServiceNow ID ${sn} copiado al portapapeles.`);
        }
      });
    });

    // Column sort headers
    tableContainer.querySelectorAll('[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (!col) return;
        if (this.filters.sort_by === col) {
          this.filters.sort_direction = this.filters.sort_direction === 'ASC' ? 'DESC' : 'ASC';
        } else {
          this.filters.sort_by = col;
          this.filters.sort_direction = 'ASC';
        }
        this.fetchTickets();
      });
    });
  }

  private renderPaginationFooter(): void {
    const footer = this.container.querySelector('#tickets-pagination-footer');
    if (!footer) return;

    const start = this.pagination.total === 0 ? 0 : (this.pagination.page - 1) * this.pagination.limit + 1;
    const end = Math.min(this.pagination.total, this.pagination.page * this.pagination.limit);

    footer.innerHTML = `
      <div class="flex items-center gap-3 text-xs text-slate-500 font-lato">
        <span>Mostrando <strong class="text-slate-800">${start}</strong> a <strong class="text-slate-800">${end}</strong> de <strong class="text-slate-800">${this.pagination.total}</strong> casos</span>
        <span class="text-slate-300">|</span>
        <div class="flex items-center gap-1.5">
          <span>Filas por página:</span>
          <select id="pagination-limit-select" class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-montserrat font-semibold focus:outline-none">
            <option value="10" ${this.pagination.limit === 10 ? 'selected' : ''}>10</option>
            <option value="25" ${this.pagination.limit === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${this.pagination.limit === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${this.pagination.limit === 100 ? 'selected' : ''}>100</option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button 
          id="pagination-prev-btn"
          ${this.pagination.page <= 1 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-montserrat font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>

        <span class="px-3 py-1 text-xs font-mono text-slate-600 font-bold">
          Pág. ${this.pagination.page} de ${this.pagination.totalPages || 1}
        </span>

        <button 
          id="pagination-next-btn"
          ${this.pagination.page >= this.pagination.totalPages ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-montserrat font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente →
        </button>
      </div>
    `;

    footer.querySelector('#pagination-prev-btn')?.addEventListener('click', () => {
      if (this.pagination.page > 1) {
        this.filters.page = this.pagination.page - 1;
        this.fetchTickets();
      }
    });

    footer.querySelector('#pagination-next-btn')?.addEventListener('click', () => {
      if (this.pagination.page < this.pagination.totalPages) {
        this.filters.page = this.pagination.page + 1;
        this.fetchTickets();
      }
    });

    const limitSelect = footer.querySelector('#pagination-limit-select') as HTMLSelectElement;
    limitSelect?.addEventListener('change', () => {
      this.filters.limit = Number(limitSelect.value);
      this.filters.page = 1;
      this.fetchTickets();
    });
  }

  private bindDOMEvents(): void {
    // New Ticket CTA
    this.container.querySelector('#new-ticket-btn')?.addEventListener('click', () => {
      this.onOpenNewTicket();
    });

    // Search input with debounce
    const searchInput = this.container.querySelector('#ticket-search-input') as HTMLInputElement;
    let debounceTimer: any;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.filters.search = searchInput.value;
        this.filters.page = 1;
        this.fetchTickets();
      }, 300);
    });

    // Toggle Advanced filters panel
    const toggleFiltersBtn = this.container.querySelector('#toggle-filters-btn');
    toggleFiltersBtn?.addEventListener('click', () => {
      this.isFiltersOpen = !this.isFiltersOpen;
      const panel = this.container.querySelector('#advanced-filters-panel');
      if (this.isFiltersOpen) {
        panel?.classList.remove('hidden');
        panel?.classList.add('grid');
      } else {
        panel?.classList.add('hidden');
        panel?.classList.remove('grid');
      }
    });

    // Filter selectors changes
    const bindSelect = (selectorId: string, filterKey: keyof TicketFilters) => {
      const el = this.container.querySelector(selectorId) as HTMLSelectElement;
      el?.addEventListener('change', () => {
        (this.filters as any)[filterKey] = el.value;
        this.filters.page = 1;
        this.render();
      });
    };

    bindSelect('#filter-prioridad', 'prioridad');
    bindSelect('#filter-estado', 'estado');
    bindSelect('#filter-plataforma', 'plataforma_id');
    bindSelect('#filter-turno', 'turno');
    bindSelect('#filter-cliente', 'cliente_id');
    bindSelect('#filter-agente', 'agente_id');

    const desdeInput = this.container.querySelector('#filter-fecha-desde') as HTMLInputElement;
    desdeInput?.addEventListener('change', () => {
      this.filters.fecha_desde = desdeInput.value;
      this.filters.page = 1;
      this.render();
    });

    const hastaInput = this.container.querySelector('#filter-fecha-hasta') as HTMLInputElement;
    hastaInput?.addEventListener('change', () => {
      this.filters.fecha_hasta = hastaInput.value;
      this.filters.page = 1;
      this.render();
    });

    // Remove single filter chip
    this.container.querySelectorAll('[data-remove-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-remove-filter');
        if (key === 'fechas') {
          this.filters.fecha_desde = '';
          this.filters.fecha_hasta = '';
        } else if (key) {
          (this.filters as any)[key] = '';
        }
        this.filters.page = 1;
        this.render();
      });
    });

    // Clear all filters
    this.container.querySelector('#clear-all-filters-btn')?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Export menu dropdown
    const exportBtn = this.container.querySelector('#export-menu-btn');
    const exportMenu = this.container.querySelector('#export-dropdown-menu');

    exportBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!exportMenu?.contains(e.target as Node) && !exportBtn?.contains(e.target as Node)) {
        exportMenu?.classList.add('hidden');
      }
    });

    this.container.querySelector('#print-view-btn')?.addEventListener('click', () => {
      window.print();
    });
  }

  private clearAllFilters(): void {
    this.filters = {
      search: '',
      prioridad: '',
      cliente_id: '',
      plataforma_id: '',
      agente_id: '',
      turno: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      sort_by: 'id',
      sort_direction: 'DESC',
      page: 1,
      limit: this.filters.limit || 25
    };
    this.render();
  }

  private getSortIcon(col: string): string {
    if (this.filters.sort_by !== col) {
      return `<svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>`;
    }
    if (this.filters.sort_direction === 'ASC') {
      return `<svg class="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>`;
    }
    return `<svg class="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
  }

  private formatDateColombian(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return dateStr;
    }
  }

  private openQuickStatusModal(ticketId: number): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal border border-slate-100">
        <h3 class="text-base font-montserrat font-bold text-slate-800 mb-2">Cambiar Estado del Caso #${ticketId}</h3>
        <p class="text-xs font-lato text-slate-500 mb-4">Seleccione el nuevo estado para la atención de este ticket:</p>

        <div class="space-y-2 mb-6">
          ${['ABIERTO', 'EN PROCESO', 'PENDIENTE', 'RESUELTO', 'CERRADO']
            .map(
              (st) => `
            <button 
              data-new-status="${st}" 
              class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/50 text-xs font-montserrat font-bold transition-all flex items-center justify-between group"
            >
              <span>${st}</span>
              <span class="w-2 h-2 rounded-full group-hover:scale-150 transition-transform badge-status-${st.toLowerCase().replace(/\s+/g, '-')}"></span>
            </button>
          `
            )
            .join('')}
        </div>

        <button id="close-quick-status-btn" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-montserrat font-semibold rounded-xl transition-colors">
          Cancelar
        </button>
      </div>
    `;

    modal.querySelectorAll('[data-new-status]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.getAttribute('data-new-status');
        if (newStatus) {
          try {
            await api.changeTicketStatus(ticketId, newStatus);
            toast.success(`Caso #${ticketId} actualizado a ${newStatus}`);
            modal.remove();
            this.fetchTickets();
          } catch (err: any) {
            toast.error(err.message || 'Error al cambiar estado.');
          }
        }
      });
    });

    modal.querySelector('#close-quick-status-btn')?.addEventListener('click', () => {
      modal.remove();
    });

    modalContainer.appendChild(modal);
  }
}
