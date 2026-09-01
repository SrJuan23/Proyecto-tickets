import { api } from '../services/api';
import { toast } from '../services/toast';
import { User, Client, Platform } from '../types';

type EntityTab = 'users' | 'clients' | 'platforms';

export class SettingsView {
  private container: HTMLElement;
  private activeTab: EntityTab = 'users';
  private users: User[] = [];
  private clients: Client[] = [];
  private platforms: Platform[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async render(): Promise<void> {
    const isAdmin = api.hasRole('ADMIN');

    this.container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Configuración del Sistema</h1>
          <p class="text-xs font-lato text-slate-500 mt-1">Panel de administración general</p>
        </div>

        ${isAdmin ? `
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="flex border-b border-slate-200/80">
            <button data-tab="users" class="settings-tab px-4 py-3 text-xs font-montserrat font-bold ${this.activeTab === 'users' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary-light/40' : 'text-slate-500 hover:text-slate-700'}">Usuarios</button>
            <button data-tab="clients" class="settings-tab px-4 py-3 text-xs font-montserrat font-bold ${this.activeTab === 'clients' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary-light/40' : 'text-slate-500 hover:text-slate-700'}">Clientes</button>
            <button data-tab="platforms" class="settings-tab px-4 py-3 text-xs font-montserrat font-bold ${this.activeTab === 'platforms' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary-light/40' : 'text-slate-500 hover:text-slate-700'}">Plataformas</button>
          </div>

          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-montserrat font-bold text-slate-800">${this.getTabTitle()}</h3>
              <button id="new-entity-btn" class="px-3.5 py-1.5 bg-brand-dark hover:bg-brand-dark-hover text-white text-xs font-montserrat font-semibold rounded-xl transition-colors">Nuevo</button>
            </div>

            <div class="overflow-x-auto" id="entity-table-container">
              <div class="p-6 text-center text-slate-400 text-xs">Cargando...</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="bg-gradient-to-r from-brand-dark to-[#131c44] text-white p-6 rounded-3xl shadow-xl space-y-4">
          <h3 class="font-montserrat font-bold text-sm tracking-tight text-brand-cyan">Matriz de Roles y Permisos</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-lato text-slate-300">
            <div class="bg-white/10 p-4 rounded-2xl border border-white/10">
              <span class="font-montserrat font-bold text-white block text-sm mb-1">Administrador (ADMIN)</span>
              <p class="leading-relaxed text-[11px]">Acceso total. Puede crear, editar y eliminar tickets, administrar clientes, plataformas, agentes, usuarios y ajustar configuraciones del sistema.</p>
            </div>
            <div class="bg-white/10 p-4 rounded-2xl border border-white/10">
              <span class="font-montserrat font-bold text-white block text-sm mb-1">Agente (AGENTE)</span>
              <p class="leading-relaxed text-[11px]">Operación diaria. Puede crear y editar tickets, cambiar estados, consultar clientes y exportar reportes de casos.</p>
            </div>
            <div class="bg-white/10 p-4 rounded-2xl border border-white/10">
              <span class="font-montserrat font-bold text-white block text-sm mb-1">Consulta (CONSULTA)</span>
              <p class="leading-relaxed text-[11px]">Solo lectura. Puede buscar, filtrar, consultar estadísticas del dashboard y descargar reportes sin modificar información.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindGlobalEvents();
    await this.fetchTabData();
  }

  private getTabTitle(): string {
    switch (this.activeTab) {
      case 'users': return 'Usuarios del Sistema';
      case 'clients': return 'Clientes / Empresas';
      case 'platforms': return 'Plataformas Tecnológicas';
    }
  }

  private async fetchTabData(): Promise<void> {
    try {
      if (this.activeTab === 'users') {
        const res = await api.getUsers();
        this.users = res.data || [];
        this.renderUsersTable();
      } else if (this.activeTab === 'clients') {
        const res = await api.getClients();
        this.clients = res.data || [];
        this.renderClientsTable();
      } else if (this.activeTab === 'platforms') {
        const res = await api.getPlatforms();
        this.platforms = res.data || [];
        this.renderPlatformsTable();
      }
    } catch (err: any) {
      console.error('SettingsView fetchTabData error', err);
      const container = this.container.querySelector('#entity-table-container');
      if (container) {
        container.innerHTML = `<div class="p-6 text-center text-rose-500 text-xs">Error al cargar datos: ${err.message}</div>`;
      }
    }
  }

  private renderUsersTable(): void {
    const container = this.container.querySelector('#entity-table-container');
    if (!container) return;
    container.innerHTML = this.buildTable([
      { key: 'nombre', label: 'Usuario' },
      { key: 'email', label: 'Correo' },
      { key: 'rol', label: 'Rol' },
      { key: 'estado', label: 'Estado' }
    ], this.users, (u) => `
      <td class="py-3 px-4 font-montserrat font-bold text-slate-800">${u.nombre}</td>
      <td class="py-3 px-4 text-slate-600">${u.email}</td>
      <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-bold ${u.rol === 'ADMIN' ? 'bg-indigo-100 text-brand-primary' : u.rol === 'AGENTE' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'}">${u.rol}</span></td>
      <td class="py-3 px-4"><span class="text-[11px] font-semibold ${u.estado === 'ACTIVO' ? 'text-emerald-600' : 'text-slate-400'}">${u.estado}</span></td>
    `, 'user');
    this.bindTableActions(container as HTMLElement, 'user', api, 'toggleUserStatus', 'deleteUser');
  }

  private renderClientsTable(): void {
    const container = this.container.querySelector('#entity-table-container');
    if (!container) return;
    container.innerHTML = this.buildTable([
      { key: 'nombre', label: 'Cliente' },
      { key: 'nit', label: 'NIT' },
      { key: 'contacto_principal', label: 'Contacto' },
      { key: 'estado', label: 'Estado' }
    ], this.clients, (c) => `
      <td class="py-3 px-4 font-montserrat font-bold text-slate-800">${c.nombre}</td>
      <td class="py-3 px-4 text-slate-600 font-mono">${c.nit || '-'}</td>
      <td class="py-3 px-4 text-slate-600">${c.contacto_principal || '-'}</td>
      <td class="py-3 px-4"><span class="text-[11px] font-semibold ${c.estado === 'ACTIVO' ? 'text-emerald-600' : 'text-slate-400'}">${c.estado}</span></td>
    `, 'client');
    this.bindTableActions(container as HTMLElement, 'client', api, 'toggleClientStatus', 'deleteClient');
  }

  private renderPlatformsTable(): void {
    const container = this.container.querySelector('#entity-table-container');
    if (!container) return;
    container.innerHTML = this.buildTable([
      { key: 'nombre', label: 'Plataforma' },
      { key: 'descripcion', label: 'Descripción' },
      { key: 'total_casos', label: 'Casos' },
      { key: 'estado', label: 'Estado' }
    ], this.platforms, (p) => `
      <td class="py-3 px-4 font-montserrat font-bold text-slate-800">${p.nombre}</td>
      <td class="py-3 px-4 text-slate-600">${p.descripcion || '-'}</td>
      <td class="py-3 px-4 text-slate-600">${p.total_casos || 0}</td>
      <td class="py-3 px-4"><span class="text-[11px] font-semibold ${p.estado === 'ACTIVO' ? 'text-emerald-600' : 'text-slate-400'}">${p.estado}</span></td>
    `, 'platform');
    this.bindTableActions(container as HTMLElement, 'platform', api, 'togglePlatformStatus', 'deletePlatform');
  }

  private buildTable(headers: { key: string; label: string }[], items: any[], rowHtml: (item: any) => string, type: string): string {
    if (items.length === 0) {
      return `<div class="p-6 text-center text-slate-400 text-xs">No hay registros.</div>`;
    }
    return `
      <table class="w-full text-left border-collapse text-xs font-lato">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200/80 text-[11px] font-montserrat font-bold text-slate-500 uppercase tracking-wider">
            ${headers.map(h => `<th class="py-3 px-4">${h.label}</th>`).join('')}
            <th class="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${items.map((item) => `
            <tr class="hover:bg-slate-50 transition-colors">
              ${rowHtml(item)}
              <td class="py-3 px-4 text-right">
                <button data-edit-${type}="${item.id}" class="text-xs text-brand-primary hover:text-brand-primary-hover font-semibold p-1 mr-2">Editar</button>
                <button data-toggle-${type}="${item.id}" class="text-xs text-amber-600 hover:text-amber-800 font-semibold p-1 mr-2">${item.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</button>
                <button data-delete-${type}="${item.id}" class="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private bindGlobalEvents(): void {
    this.container.querySelectorAll('.settings-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn.getAttribute('data-tab') as EntityTab) || 'users';
        this.render();
      });
    });

    this.container.querySelector('#new-entity-btn')?.addEventListener('click', () => {
      this.openEntityModal();
    });
  }

  private bindTableActions(container: HTMLElement, type: string, apiInstance: any, toggleName: string, deleteName: string): void {
    container.querySelectorAll(`[data-edit-${type}]`).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute(`data-edit-${type}`));
        this.openEditEntityModal(id);
      });
    });

    container.querySelectorAll(`[data-toggle-${type}]`).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute(`data-toggle-${type}`));
        if (!confirm('¿Cambiar estado?')) return;
        try {
          const res = await apiInstance[toggleName](id);
          toast.success(res.message || 'Estado actualizado.');
          await this.fetchTabData();
        } catch (e: any) {
          toast.error(e.message || 'Error al cambiar estado.');
        }
      });
    });

    container.querySelectorAll(`[data-delete-${type}]`).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute(`data-delete-${type}`));
        if (!confirm(`¿Eliminar ID ${id}?`)) return;
        try {
          await apiInstance[deleteName](id);
          toast.success('Eliminado correctamente.');
          await this.fetchTabData();
        } catch (e: any) {
          toast.error(e.message || 'Error al eliminar.');
        }
      });
    });
  }

  private openEntityModal(): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    const title = this.getModalTitle();
    const formContent = this.getModalFormContent();

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between">
          <h3 class="text-sm font-montserrat font-bold">${title}</h3>
          <button id="close-e-modal" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <form id="entity-form" class="p-6 space-y-4 text-xs font-lato">
          ${formContent}
          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancel-e-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-semibold rounded-xl">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold rounded-xl shadow-brand">Guardar</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-e-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-e-modal')?.addEventListener('click', closeModal);

    const form = modal.querySelector('#entity-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        await this.submitEntityForm(formData);
        toast.success('Guardado correctamente.');
        closeModal();
        await this.fetchTabData();
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar.');
      }
    });

    modalContainer.appendChild(modal);
  }

  private getModalTitle(): string {
    switch (this.activeTab) {
      case 'users': return 'Crear Usuario del Sistema';
      case 'clients': return 'Registrar Nuevo Cliente';
      case 'platforms': return 'Registrar Nueva Plataforma';
    }
  }

  private getModalFormContent(): string {
    switch (this.activeTab) {
      case 'users':
        return `
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre Completo *</label><input type="text" name="nombre" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo *</label><input type="email" name="email" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Contraseña *</label><input type="password" name="password" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Rol *</label><select name="rol" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"><option value="AGENTE">AGENTE</option><option value="ADMIN">ADMIN</option><option value="CONSULTA">CONSULTA</option></select></div>
        `;
      case 'clients':
        return `
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre *</label><input type="text" name="nombre" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">NIT</label><input type="text" name="nit" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Contacto</label><input type="text" name="contacto_principal" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo</label><input type="email" name="correo_contacto" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Teléfono</label><input type="text" name="telefono" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
        `;
      case 'platforms':
        return `
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre *</label><input type="text" name="nombre" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Descripción</label><textarea name="descripcion" rows="3" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"></textarea></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Color Badge</label><input type="color" name="color_badge" value="#0945F7" class="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer" /></div>
        `;
    }
    return '';
  }

  private async submitEntityForm(formData: FormData): Promise<void> {
    const data: any = {};
    formData.forEach((value, key) => { data[key] = value; });

    switch (this.activeTab) {
      case 'users':
        await api.createUser({ nombre: data.nombre, email: data.email, password: data.password, rol: data.rol });
        break;
      case 'clients':
        await api.createClient({ nombre: data.nombre, nit: data.nit, contacto_principal: data.contacto_principal, correo_contacto: data.correo_contacto, telefono: data.telefono });
        break;
      case 'platforms':
        await api.createPlatform({ nombre: data.nombre, descripcion: data.descripcion, color_badge: data.color_badge });
        break;
    }
  }

  private async openEditEntityModal(id: number): Promise<void> {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    let entity: any = null;
    try {
      if (this.activeTab === 'users') entity = this.users.find((u) => u.id === id);
      else if (this.activeTab === 'clients') entity = this.clients.find((c) => c.id === id);
      else if (this.activeTab === 'platforms') entity = this.platforms.find((p) => p.id === id);
    } catch (err) {
      toast.error('No se pudo cargar la entidad.');
      return;
    }

    if (!entity) {
      toast.error('Entidad no encontrada.');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between">
          <h3 class="text-sm font-montserrat font-bold">Editar ${this.getSingularTitle()}</h3>
          <button id="close-e-modal" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <form id="entity-edit-form" class="p-6 space-y-4 text-xs font-lato">
          ${this.getEditFormContent(entity)}
          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancel-e-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-semibold rounded-xl">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold rounded-xl shadow-brand">Guardar</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-e-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-e-modal')?.addEventListener('click', closeModal);

    const form = modal.querySelector('#entity-edit-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        await this.submitEditEntityForm(formData, id);
        toast.success('Actualizado correctamente.');
        closeModal();
        await this.fetchTabData();
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar.');
      }
    });

    modalContainer.appendChild(modal);
  }

  private getSingularTitle(): string {
    switch (this.activeTab) {
      case 'users': return 'Usuario';
      case 'clients': return 'Cliente';
      case 'platforms': return 'Plataforma';
    }
    return 'Registro';
  }

  private getEditFormContent(entity: any): string {
    switch (this.activeTab) {
      case 'users':
        return `
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre Completo *</label><input type="text" name="nombre" value="${entity.nombre || ''}" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo *</label><input type="email" name="email" value="${entity.email || ''}" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Contraseña (dejar vacío para no cambiar)</label><input type="password" name="password" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Teléfono</label><input type="text" name="telefono" value="${entity.telefono || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Especialidad</label><input type="text" name="especialidad" value="${entity.especialidad || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
        `;
      case 'clients':
        return `
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre *</label><input type="text" name="nombre" value="${entity.nombre || ''}" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">NIT</label><input type="text" name="nit" value="${entity.nit || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Contacto</label><input type="text" name="contacto_principal" value="${entity.contacto_principal || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo</label><input type="email" name="correo_contacto" value="${entity.correo_contacto || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Teléfono</label><input type="text" name="telefono" value="${entity.telefono || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
        `;
      case 'platforms':
        return `
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre *</label><input type="text" name="nombre" value="${entity.nombre || ''}" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" /></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Descripción</label><textarea name="descripcion" rows="3" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">${entity.descripcion || ''}</textarea></div>
          <div><label class="block font-montserrat font-semibold text-slate-700 mb-1">Color Badge</label><input type="color" name="color_badge" value="${entity.color_badge || '#0945F7'}" class="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer" /></div>
        `;
    }
    return '';
  }

  private async submitEditEntityForm(formData: FormData, id: number): Promise<void> {
    const data: any = {};
    formData.forEach((value, key) => { data[key] = value; });

    switch (this.activeTab) {
      case 'users':
        await api.updateUser(id, { nombre: data.nombre, email: data.email, password: data.password || undefined, telefono: data.telefono, especialidad: data.especialidad });
        break;
      case 'clients':
        await api.updateClient(id, { nombre: data.nombre, nit: data.nit, contacto_principal: data.contacto_principal, correo_contacto: data.correo_contacto, telefono: data.telefono });
        break;
      case 'platforms':
        await api.updatePlatform(id, { nombre: data.nombre, descripcion: data.descripcion, color_badge: data.color_badge });
        break;
    }
  }
}
