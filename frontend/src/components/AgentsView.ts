import { api } from '../services/api';
import { toast } from '../services/toast';
import { Agent } from '../types';

export class AgentsView {
  private container: HTMLElement;
  private agents: Agent[] = [];
  private search: string = '';
  private onFilterByAgent: (agentId: number) => void;

  constructor(container: HTMLElement, onFilterByAgent: (agentId: number) => void) {
    this.container = container;
    this.onFilterByAgent = onFilterByAgent;
  }

  public async render(): Promise<void> {
    const canManage = api.hasRole('ADMIN', 'AGENTE');

    this.container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-12">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div>
            <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Equipo de Soporte y Agentes</h1>
            <p class="text-xs font-lato text-slate-500 mt-1">Ingenieros de mesa de ayuda, especialistas y analistas de ciberseguridad</p>
          </div>

          ${
            canManage
              ? `<button id="new-agent-btn" class="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat text-xs font-semibold rounded-xl shadow-brand transition-all flex items-center gap-2 transform active:scale-95">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                  <span>Nuevo Agente</span>
                </button>`
              : ''
          }
        </div>

        <!-- Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="agent-search-input" 
              value="${this.search}" 
              placeholder="Buscar agente por nombre, especialidad o correo..." 
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none"
            />
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Agents Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="agents-grid">
          <div class="col-span-full py-12 text-center text-slate-400 text-sm">Cargando agentes...</div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchAgents();
  }

  private bindEvents(): void {
    const searchInput = this.container.querySelector('#agent-search-input') as HTMLInputElement;
    let timer: any;
    searchInput?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.search = searchInput.value;
        this.fetchAgents();
      }, 300);
    });

    this.container.querySelector('#new-agent-btn')?.addEventListener('click', () => {
      this.openAgentModal();
    });
  }

  private async fetchAgents(): Promise<void> {
    const grid = this.container.querySelector('#agents-grid');
    if (!grid) return;

    try {
      const res = await api.getAgents(this.search);
      if (res.data) {
        this.agents = res.data;
        this.renderGrid();
      }
    } catch (err: any) {
      grid.innerHTML = `<div class="col-span-full p-8 text-center text-rose-500 text-sm">Error al cargar agentes: ${err.message}</div>`;
    }
  }

  private renderGrid(): void {
    const grid = this.container.querySelector('#agents-grid');
    if (!grid) return;

    if (this.agents.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">No se encontraron agentes registrados.</div>`;
      return;
    }

    const canManage = api.hasRole('ADMIN', 'AGENTE');

    grid.innerHTML = this.agents
      .map(
        (a) => `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-accent1 text-white font-montserrat font-bold text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                ${a.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 class="text-sm font-montserrat font-bold text-slate-900 leading-snug">${a.nombre}</h3>
                <span class="text-[11px] font-lato text-brand-primary font-semibold">${a.especialidad || 'Soporte General'}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-bold ${
              a.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }">
              ${a.estado}
            </span>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-lato">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Correo:</span>
              <span class="text-slate-800 font-medium">${a.email || 'No registrado'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Teléfono:</span>
              <span class="text-slate-700 font-mono">${a.telefono || 'No registrado'}</span>
            </div>
          </div>

          <!-- Stats breakdown -->
          <div class="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
            <div>
              <span class="text-[10px] text-slate-400 font-montserrat uppercase font-semibold block">Atendidos</span>
              <span class="text-sm font-montserrat font-bold text-slate-800">${a.total_casos || 0}</span>
            </div>
            <div>
              <span class="text-[10px] text-brand-primary font-montserrat uppercase font-semibold block">Activos</span>
              <span class="text-sm font-montserrat font-bold text-brand-primary">${a.casos_abiertos || 0}</span>
            </div>
            <div>
              <span class="text-[10px] text-emerald-600 font-montserrat uppercase font-semibold block">Cerrados</span>
              <span class="text-sm font-montserrat font-bold text-emerald-700">${a.casos_cerrados || 0}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button 
            data-view-agent-tickets="${a.id}"
            class="text-xs font-montserrat font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
          >
            <span>Ver tickets asignados</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          ${
            canManage
              ? `
              <div class="flex items-center gap-1">
                <button data-edit-agent="${a.id}" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors" title="Editar agente">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button data-toggle-agent="${a.id}" class="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors" title="Activar/Desactivar">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                </button>
              </div>
            `
              : ''
          }
        </div>
      </div>
    `
      )
      .join('');

    // Bind item buttons
    grid.querySelectorAll('[data-view-agent-tickets]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-view-agent-tickets'));
        if (id) this.onFilterByAgent(id);
      });
    });

    grid.querySelectorAll('[data-edit-agent]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-edit-agent'));
        const ag = this.agents.find((a) => a.id === id);
        if (ag) this.openAgentModal(ag);
      });
    });

    grid.querySelectorAll('[data-toggle-agent]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-toggle-agent'));
        if (id) {
          try {
            const res = await api.toggleAgentStatus(id);
            toast.success(res.message || 'Estado del agente actualizado.');
            this.fetchAgents();
          } catch (err: any) {
            toast.error(err.message || 'Error al cambiar estado.');
          }
        }
      });
    });
  }

  private openAgentModal(agent?: Agent): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const isEdit = !!agent;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between">
          <h3 class="text-sm font-montserrat font-bold">${isEdit ? 'Editar Agente' : 'Registrar Nuevo Agente'}</h3>
          <button id="close-a-modal" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>

        <form id="agent-form" class="p-6 space-y-4 text-xs font-lato">
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre Completo del Agente *</label>
            <input type="text" name="nombre" value="${agent?.nombre || ''}" required placeholder="Ej. Didier Santamaría" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Especialidad Técnica</label>
            <input type="text" name="especialidad" value="${agent?.especialidad || ''}" placeholder="Ej. Ciberseguridad FortiEDR, FlexWAN..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input type="email" name="email" value="${agent?.email || ''}" placeholder="agente@supportdesk.com" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Teléfono</label>
            <input type="text" name="telefono" value="${agent?.telefono || ''}" placeholder="+57 311 000 0000" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancel-a-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-semibold rounded-xl transition-colors">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold rounded-xl shadow-brand transition-all">${isEdit ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-a-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-a-modal')?.addEventListener('click', closeModal);

    const form = modal.querySelector('#agent-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        nombre: String(formData.get('nombre')),
        especialidad: String(formData.get('especialidad')),
        email: String(formData.get('email')),
        telefono: String(formData.get('telefono'))
      };

      try {
        if (isEdit && agent) {
          await api.updateAgent(agent.id, data);
          toast.success('Agente actualizado correctamente.');
        } else {
          await api.createAgent(data);
          toast.success('Agente registrado correctamente.');
        }
        closeModal();
        this.fetchAgents();
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar agente.');
      }
    });

    modalContainer.appendChild(modal);
  }
}
