import { api } from '../services/api';
import { toast } from '../services/toast';
import { Client } from '../types';

export class ClientsView {
  private container: HTMLElement;
  private clients: Client[] = [];
  private search: string = '';
  private estado: string = '';
  private onFilterByClient: (clientId: number) => void;

  constructor(container: HTMLElement, onFilterByClient: (clientId: number) => void) {
    this.container = container;
    this.onFilterByClient = onFilterByClient;
  }

  public async render(): Promise<void> {
    const canManage = api.hasRole('ADMIN', 'AGENTE');

    this.container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-12">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div>
            <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Gestión de Clientes</h1>
            <p class="text-xs font-lato text-slate-500 mt-1">Empresas, instituciones y cuentas que originan casos de soporte</p>
          </div>

          ${
            canManage
              ? `<button id="new-client-btn" class="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat text-xs font-semibold rounded-xl shadow-brand transition-all flex items-center gap-2 transform active:scale-95">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                  <span>+ Nuevo Cliente</span>
                </button>`
              : ''
          }
        </div>

        <!-- Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="client-search-input" 
              value="${this.search}" 
              placeholder="Buscar cliente por nombre, NIT o contacto..." 
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none"
            />
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          <select id="client-status-filter" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-montserrat font-semibold focus:outline-none">
            <option value="" ${this.estado === '' ? 'selected' : ''}>Todos los estados</option>
            <option value="ACTIVO" ${this.estado === 'ACTIVO' ? 'selected' : ''}>Activos</option>
            <option value="INACTIVO" ${this.estado === 'INACTIVO' ? 'selected' : ''}>Inactivos</option>
          </select>
        </div>

        <!-- Client Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="clients-grid">
          <div class="col-span-full py-12 text-center text-slate-400 text-sm">Cargando clientes...</div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchClients();
  }

  private bindEvents(): void {
    const searchInput = this.container.querySelector('#client-search-input') as HTMLInputElement;
    let timer: any;
    searchInput?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.search = searchInput.value;
        this.fetchClients();
      }, 300);
    });

    const statusSelect = this.container.querySelector('#client-status-filter') as HTMLSelectElement;
    statusSelect?.addEventListener('change', () => {
      this.estado = statusSelect.value;
      this.fetchClients();
    });

    this.container.querySelector('#new-client-btn')?.addEventListener('click', () => {
      this.openClientModal();
    });
  }

  private async fetchClients(): Promise<void> {
    const grid = this.container.querySelector('#clients-grid');
    if (!grid) return;

    try {
      const res = await api.getClients(this.search, this.estado);
      if (res.data) {
        this.clients = res.data;
        this.renderGrid();
      }
    } catch (err: any) {
      grid.innerHTML = `<div class="col-span-full p-8 text-center text-rose-500 text-sm">Error al cargar clientes: ${err.message}</div>`;
    }
  }

  private renderGrid(): void {
    const grid = this.container.querySelector('#clients-grid');
    if (!grid) return;

    if (this.clients.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">No se encontraron clientes registrados.</div>`;
      return;
    }

    const canManage = api.hasRole('ADMIN', 'AGENTE');

    grid.innerHTML = this.clients
      .map(
        (c) => `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-brand-primary-light text-brand-primary font-montserrat font-bold text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                ${c.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 class="text-sm font-montserrat font-bold text-slate-900 leading-snug line-clamp-1">${c.nombre}</h3>
                <span class="text-[11px] font-mono text-slate-400">${c.nit ? `NIT: ${c.nit}` : 'Sin NIT'}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-bold ${
              c.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }">
              ${c.estado}
            </span>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-lato">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Contacto principal:</span>
              <span class="font-medium text-slate-800">${c.contacto_principal || 'No registrado'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Correo:</span>
              <span class="text-brand-primary truncate max-w-[170px]">${c.correo_contacto || 'No registrado'}</span>
            </div>
          </div>

          <!-- Mini Stats breakdown -->
          <div class="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
            <div>
              <span class="text-[10px] text-slate-400 font-montserrat uppercase font-semibold block">Total</span>
              <span class="text-sm font-montserrat font-bold text-slate-800">${c.total_casos || 0}</span>
            </div>
            <div>
              <span class="text-[10px] text-cyan-600 font-montserrat uppercase font-semibold block">Abiertos</span>
              <span class="text-sm font-montserrat font-bold text-cyan-700">${c.casos_abiertos || 0}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 font-montserrat uppercase font-semibold block">Cerrados</span>
              <span class="text-sm font-montserrat font-bold text-slate-600">${c.casos_cerrados || 0}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button 
            data-view-client-tickets="${c.id}"
            class="text-xs font-montserrat font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
          >
            <span>Ver casos (${c.total_casos || 0})</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          ${
            canManage
              ? `
              <div class="flex items-center gap-1">
                <button data-edit-client="${c.id}" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors" title="Editar cliente">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button data-toggle-client="${c.id}" class="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors" title="Activar/Desactivar">
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
    grid.querySelectorAll('[data-view-client-tickets]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-view-client-tickets'));
        if (id) this.onFilterByClient(id);
      });
    });

    grid.querySelectorAll('[data-edit-client]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-edit-client'));
        const client = this.clients.find((c) => c.id === id);
        if (client) this.openClientModal(client);
      });
    });

    grid.querySelectorAll('[data-toggle-client]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-toggle-client'));
        if (id) {
          try {
            const res = await api.toggleClientStatus(id);
            toast.success(res.message || 'Estado del cliente actualizado.');
            this.fetchClients();
          } catch (err: any) {
            toast.error(err.message || 'Error al cambiar estado.');
          }
        }
      });
    });
  }

  private openClientModal(client?: Client): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const isEdit = !!client;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between">
          <h3 class="text-sm font-montserrat font-bold">${isEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
          <button id="close-c-modal" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>

        <form id="client-form" class="p-6 space-y-4 text-xs font-lato">
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre de la Empresa / Cliente *</label>
            <input type="text" name="nombre" value="${client?.nombre || ''}" required placeholder="Ej. INVERSIONES CLÍNICA DEL META S.A." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">NIT</label>
            <input type="text" name="nit" value="${client?.nit || ''}" placeholder="Ej. 892000145-1" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none font-mono" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Contacto Principal</label>
            <input type="text" name="contacto_principal" value="${client?.contacto_principal || ''}" placeholder="Ej. Jimmy Pardo" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input type="email" name="correo_contacto" value="${client?.correo_contacto || ''}" placeholder="contacto@empresa.com" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Teléfono</label>
            <input type="text" name="telefono" value="${client?.telefono || ''}" placeholder="+57 310 000 0000" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none" />
          </div>

          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancel-c-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-semibold rounded-xl transition-colors">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold rounded-xl shadow-brand transition-all">${isEdit ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-c-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-c-modal')?.addEventListener('click', closeModal);

    const form = modal.querySelector('#client-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        nombre: String(formData.get('nombre')),
        nit: String(formData.get('nit')),
        contacto_principal: String(formData.get('contacto_principal')),
        correo_contacto: String(formData.get('correo_contacto')),
        telefono: String(formData.get('telefono'))
      };

      try {
        if (isEdit && client) {
          await api.updateClient(client.id, data);
          toast.success('Cliente actualizado correctamente.');
        } else {
          await api.createClient(data);
          toast.success('Cliente registrado correctamente.');
        }
        closeModal();
        this.fetchClients();
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar cliente.');
      }
    });

    modalContainer.appendChild(modal);
  }
}
