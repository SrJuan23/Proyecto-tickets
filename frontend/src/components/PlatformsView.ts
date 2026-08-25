import { api } from '../services/api';
import { toast } from '../services/toast';
import { Platform } from '../types';

export class PlatformsView {
  private container: HTMLElement;
  private platforms: Platform[] = [];
  private search: string = '';
  private onFilterByPlatform: (platformId: number) => void;

  constructor(container: HTMLElement, onFilterByPlatform: (platformId: number) => void) {
    this.container = container;
    this.onFilterByPlatform = onFilterByPlatform;
  }

  public async render(): Promise<void> {
    const canManage = api.hasRole('ADMIN', 'AGENTE');

    this.container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-12">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div>
            <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Plataformas Tecnológicas</h1>
            <p class="text-xs font-lato text-slate-500 mt-1">Sistemas, soluciones y herramientas de ciberseguridad soportadas</p>
          </div>

          ${
            canManage
              ? `<button id="new-plat-btn" class="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat text-xs font-semibold rounded-xl shadow-brand transition-all flex items-center gap-2 transform active:scale-95">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                  <span>Nueva Plataforma</span>
                </button>`
              : ''
          }
        </div>

        <!-- Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-3">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="plat-search-input" 
              value="${this.search}" 
              placeholder="Buscar plataforma por nombre o descripción..." 
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none"
            />
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Platforms Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="platforms-grid">
          <div class="col-span-full py-12 text-center text-slate-400 text-sm">Cargando plataformas...</div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchPlatforms();
  }

  private bindEvents(): void {
    const searchInput = this.container.querySelector('#plat-search-input') as HTMLInputElement;
    let timer: any;
    searchInput?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.search = searchInput.value;
        this.fetchPlatforms();
      }, 300);
    });

    this.container.querySelector('#new-plat-btn')?.addEventListener('click', () => {
      this.openPlatformModal();
    });
  }

  private async fetchPlatforms(): Promise<void> {
    const grid = this.container.querySelector('#platforms-grid');
    if (!grid) return;

    try {
      const res = await api.getPlatforms(this.search);
      if (res.data) {
        this.platforms = res.data;
        this.renderGrid();
      }
    } catch (err: any) {
      grid.innerHTML = `<div class="col-span-full p-8 text-center text-rose-500 text-sm">Error al cargar plataformas: ${err.message}</div>`;
    }
  }

  private renderGrid(): void {
    const grid = this.container.querySelector('#platforms-grid');
    if (!grid) return;

    if (this.platforms.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">No se encontraron plataformas registradas.</div>`;
      return;
    }

    const canManage = api.hasRole('ADMIN', 'AGENTE');

    grid.innerHTML = this.platforms
      .map(
        (p) => `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0" style="background-color: ${p.color_badge || '#0945F7'}">
                ${p.nombre.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <h3 class="text-sm font-montserrat font-bold text-slate-900 tracking-tight">${p.nombre}</h3>
                <span class="text-[10px] font-semibold text-emerald-600">${p.estado}</span>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
              ${p.total_casos || 0} casos
            </span>
          </div>

          <p class="mt-3 text-xs font-lato text-slate-600 leading-relaxed line-clamp-2">
            ${p.descripcion || 'Sin descripción detallada.'}
          </p>

          <!-- Stats breakdown -->
          <div class="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
            <div>
              <span class="text-[10px] text-cyan-600 font-montserrat uppercase font-semibold block">Abiertos</span>
              <span class="text-sm font-montserrat font-bold text-cyan-700">${p.casos_abiertos || 0}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 font-montserrat uppercase font-semibold block">Cerrados</span>
              <span class="text-sm font-montserrat font-bold text-slate-600">${p.casos_cerrados || 0}</span>
            </div>
            <div>
              <span class="text-[10px] text-rose-500 font-montserrat uppercase font-semibold block">Alta Prio</span>
              <span class="text-sm font-montserrat font-bold text-rose-600">${p.casos_alta_prioridad || 0}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button 
            data-view-plat-tickets="${p.id}"
            class="text-xs font-montserrat font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
          >
            <span>Ver tickets asociados</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          ${
            canManage
              ? `
              <div class="flex items-center gap-1">
                <button data-edit-plat="${p.id}" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors" title="Editar plataforma">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button data-toggle-plat="${p.id}" class="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors" title="Activar/Desactivar">
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
    grid.querySelectorAll('[data-view-plat-tickets]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-view-plat-tickets'));
        if (id) this.onFilterByPlatform(id);
      });
    });

    grid.querySelectorAll('[data-edit-plat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-edit-plat'));
        const plat = this.platforms.find((p) => p.id === id);
        if (plat) this.openPlatformModal(plat);
      });
    });

    grid.querySelectorAll('[data-toggle-plat]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-toggle-plat'));
        if (id) {
          try {
            const res = await api.togglePlatformStatus(id);
            toast.success(res.message || 'Estado actualizado.');
            this.fetchPlatforms();
          } catch (err: any) {
            toast.error(err.message || 'Error al modificar estado.');
          }
        }
      });
    });
  }

  private openPlatformModal(platform?: Platform): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const isEdit = !!platform;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between">
          <h3 class="text-sm font-montserrat font-bold">${isEdit ? 'Editar Plataforma' : 'Registrar Nueva Plataforma'}</h3>
          <button id="close-p-modal" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>

        <form id="plat-form" class="p-6 space-y-4 text-xs font-lato">
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre de la Plataforma *</label>
            <input type="text" name="nombre" value="${platform?.nombre || ''}" required placeholder="Ej. FORTIEDR, FLEXWAN..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none uppercase font-mono font-bold" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Descripción</label>
            <textarea name="descripcion" rows="3" placeholder="Detalle funcional o tecnológico..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:outline-none leading-relaxed">${platform?.descripcion || ''}</textarea>
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Color del Badge</label>
            <div class="flex items-center gap-2">
              <input type="color" name="color_badge" value="${platform?.color_badge || '#0945F7'}" class="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer" />
              <span class="text-slate-500 font-mono text-xs">Identificador visual</span>
            </div>
          </div>

          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancel-p-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-semibold rounded-xl transition-colors">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold rounded-xl shadow-brand transition-all">${isEdit ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-p-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-p-modal')?.addEventListener('click', closeModal);

    const form = modal.querySelector('#plat-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        nombre: String(formData.get('nombre')),
        descripcion: String(formData.get('descripcion')),
        color_badge: String(formData.get('color_badge'))
      };

      try {
        if (isEdit && platform) {
          await api.updatePlatform(platform.id, data);
          toast.success('Plataforma actualizada correctamente.');
        } else {
          await api.createPlatform(data);
          toast.success('Plataforma registrada correctamente.');
        }
        closeModal();
        this.fetchPlatforms();
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar plataforma.');
      }
    });

    modalContainer.appendChild(modal);
  }
}
