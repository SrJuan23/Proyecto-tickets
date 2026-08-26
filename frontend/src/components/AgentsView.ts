import { api } from '../services/api';
import { toast } from '../services/toast';
import { Agent, TicketFilters, Pagination } from '../types';

export class AgentsView {
  private container: HTMLElement;
  private agents: Agent[] = [];
  private pagination: Pagination = { total: 0, page: 1, limit: 25, totalPages: 1 };
  private searchQuery: string = '';
  private estadoFilter: string = 'all';
  private onNavigateToTickets: (agentId: number) => void;

  constructor(container: HTMLElement, options: { onNavigateToTickets: (agentId: number) => void }) {
    this.container = container;
    this.onNavigateToTickets = options.onNavigateToTickets;
  }

  public async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Agentes de Soporte</h1>
          <p class="text-xs font-lato text-slate-500 mt-1">Gestión de personal de atención, rendimiento y asignación de casos</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input 
                  type="text" 
                  id="agent-search-input"
                  value="${this.searchQuery}"
                  placeholder="Buscar agente por nombre, correo o especialidad..." 
                  class="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-lato focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all w-full sm:w-72"
                />
              </div>
              <select id="agent-estado-filter" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-lato focus:outline-none">
                <option value="all" ${this.estadoFilter === 'all' ? 'selected' : ''}>Todos los estados</option>
                <option value="ACTIVO" ${this.estadoFilter === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
                <option value="INACTIVO" ${this.estadoFilter === 'INACTIVO' ? 'selected' : ''}>INACTIVO</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto" id="agents-table-container">
            <div class="p-8 text-center text-slate-400 text-xs">Cargando agentes...</div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchAgents();
  }

  private bindEvents(): void {
    const searchInput = this.container.querySelector('#agent-search-input') as HTMLInputElement;
    let debounce: any;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.searchQuery = searchInput.value.trim();
        this.fetchAgents();
      }, 300);
    });

    const estadoSelect = this.container.querySelector('#agent-estado-filter') as HTMLSelectElement;
    estadoSelect?.addEventListener('change', () => {
      this.estadoFilter = estadoSelect.value;
      this.fetchAgents();
    });
  }

  private async fetchAgents(): Promise<void> {
    try {
      const res = await api.getAgents(this.searchQuery || undefined, this.estadoFilter);
      if (res.data) {
        this.agents = res.data;
        this.renderTable();
      }
    } catch (err: any) {
      const container = this.container.querySelector('#agents-table-container');
      if (container) {
        container.innerHTML = `<div class="p-6 text-center text-rose-500 text-xs">Error al cargar agentes: ${err.message}</div>`;
      }
    }
  }

  private renderTable(): void {
    const container = this.container.querySelector('#agents-table-container');
    if (!container) return;

    if (this.agents.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No se encontraron agentes.</div>`;
      return;
    }

    container.innerHTML = `
      <table class="w-full text-left border-collapse text-xs font-lato">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200/80 text-[11px] font-montserrat font-bold text-slate-500 uppercase tracking-wider">
            <th class="py-3 px-4">Agente</th>
            <th class="py-3 px-4">Correo</th>
            <th class="py-3 px-4">Especialidad</th>
            <th class="py-3 px-4">Casos</th>
            <th class="py-3 px-4">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${this.agents.map((a) => `
            <tr class="hover:bg-slate-50 transition-colors cursor-pointer" data-agent-id="${a.id}">
              <td class="py-3 px-4 font-montserrat font-bold text-slate-800">${a.nombre}</td>
              <td class="py-3 px-4 text-slate-600">${a.email || '-'}</td>
              <td class="py-3 px-4 text-slate-600">${a.especialidad || '-'}</td>
              <td class="py-3 px-4 text-slate-700 font-semibold">${a.total_casos ?? '-'}</td>
              <td class="py-3 px-4"><span class="text-[11px] font-semibold ${a.estado === 'ACTIVO' ? 'text-emerald-600' : 'text-slate-400'}">${a.estado}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('[data-agent-id]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = Number(row.getAttribute('data-agent-id'));
        if (id) this.onNavigateToTickets(id);
      });
    });
  }
}
