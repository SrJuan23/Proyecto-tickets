import { api } from '../services/api';
import { toast } from '../services/toast';
import { Ticket } from '../types';

export class TicketDetailModal {
  private ticketId: number;
  private onEdit: (ticket: Ticket) => void;
  private onDelete: () => void;
  private onStatusChanged: () => void;

  constructor(options: {
    ticketId: number;
    onEdit: (ticket: Ticket) => void;
    onDelete: () => void;
    onStatusChanged: () => void;
  }) {
    this.ticketId = options.ticketId;
    this.onEdit = options.onEdit;
    this.onDelete = options.onDelete;
    this.onStatusChanged = options.onStatusChanged;
  }

  public async open(): Promise<void> {
    const drawerContainer = document.getElementById('drawer-container');
    if (!drawerContainer) return;

    const drawer = document.createElement('div');
    drawer.className = 'fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in';

    drawer.innerHTML = `
      <div class="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        <!-- Drawer Header -->
        <div class="px-6 py-5 bg-brand-dark text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center text-white font-mono font-bold text-sm shadow-brand">
              #${String(this.ticketId).padStart(4, '0')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-montserrat font-bold">Caso #${String(this.ticketId).padStart(4, '0')}</h2>
                <button id="detail-copy-id-btn" class="p-1 text-slate-300 hover:text-white rounded transition-colors" title="Copiar ID del caso">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
              </div>
              <p class="text-[11px] font-lato text-slate-300">Detalle completo de atención y trazabilidad</p>
            </div>
          </div>
          <button id="drawer-close-btn" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Content Area (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-lato" id="detail-content-body">
          <div class="py-12 text-center text-slate-400">Cargando detalle del caso...</div>
        </div>

        <!-- Drawer Action Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-shrink-0" id="drawer-footer-actions">
          <!-- Rendered when ticket loaded -->
        </div>
      </div>
    `;

    const closeDrawer = () => drawer.remove();
    drawer.querySelector('#drawer-close-btn')?.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });

    drawerContainer.appendChild(drawer);

    try {
      const res = await api.getTicket(this.ticketId);
      if (res.data) {
        this.renderTicketDetail(drawer, res.data);
      }
    } catch (err: any) {
      const content = drawer.querySelector('#detail-content-body');
      if (content) {
        content.innerHTML = `
          <div class="p-8 text-center text-rose-500">
            <p class="font-montserrat font-bold text-sm">Error al cargar detalle</p>
            <p class="text-xs text-slate-500 mt-1">${err.message}</p>
          </div>
        `;
      }
    }
  }

  private renderTicketDetail(drawer: HTMLElement, ticket: Ticket): void {
    const content = drawer.querySelector('#detail-content-body');
    const footer = drawer.querySelector('#drawer-footer-actions');
    if (!content || !footer) return;

    // Badges
    const prioBadgeClass = (ticket.prioridad === 'ALTO' || ticket.prioridad === 'CRITICO') ? 'badge-priority-alto' : 'badge-priority-medio';
    const statusBadgeClass = `badge-status-${ticket.estado.toLowerCase().replace(/\s+/g, '-')}`;

    content.innerHTML = `
      <!-- Status & Priority Banner -->
      <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-montserrat font-bold ${prioBadgeClass}">
            Prioridad: ${ticket.prioridad}
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-montserrat font-bold ${statusBadgeClass}">
            Estado: ${ticket.estado}
          </span>
        </div>
        <div class="text-right">
          <span class="text-[11px] text-slate-400 font-lato block">Tiempo de atención</span>
          <span class="text-xs font-montserrat font-bold text-brand-dark">${ticket.tiempo_atencion_formateado || 'En progreso'}</span>
        </div>
      </div>

      <!-- 1. INFORMACIÓN DEL CLIENTE -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="font-montserrat font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          Información del Cliente
        </h3>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-slate-400 block text-[11px]">Empresa / Organización:</span>
            <span class="font-semibold text-slate-800">${ticket.cliente_nombre || ''}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Solicitante:</span>
            <span class="font-semibold text-slate-800">${ticket.solicitante}</span>
          </div>
          ${ticket.cliente_nit ? `<div><span class="text-slate-400 block text-[11px]">NIT:</span><span class="font-mono text-slate-700">${ticket.cliente_nit}</span></div>` : ''}
          ${ticket.cliente_correo ? `<div><span class="text-slate-400 block text-[11px]">Correo Contacto:</span><span class="text-brand-primary">${ticket.cliente_correo}</span></div>` : ''}
        </div>
      </div>

      <!-- 2. SOLICITUD / DETALLES -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="font-montserrat font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          Solicitud Registrada
        </h3>
        <div>
          <span class="text-slate-400 block text-[11px]">Asunto del correo:</span>
          <span class="font-montserrat font-bold text-slate-900 text-sm block mt-0.5">${ticket.asunto}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[11px]">Descripción completa:</span>
          <div class="mt-1 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-700 leading-relaxed whitespace-pre-line font-lato">
            ${ticket.descripcion}
          </div>
        </div>
      </div>

      <!-- 3. INFORMACIÓN TÉCNICA -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="font-montserrat font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4 text-brand-accent1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
          Información Técnica y ServiceNow
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <span class="text-slate-400 block text-[11px]">Plataforma Tecnológica:</span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 mt-1">
              ${ticket.plataforma_nombre || ''}
            </span>
          </div>

          <div>
            <span class="text-slate-400 block text-[11px]">Agente de Atención:</span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 mt-1">
              ${ticket.agente_nombre || '-'}
            </span>
          </div>

          <div>
            <span class="text-slate-400 block text-[11px]">ServiceNow ID:</span>
            ${
              ticket.servicenow
                ? `
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="font-mono text-xs font-bold text-brand-dark bg-slate-100 px-2 py-0.5 rounded border border-slate-200">${ticket.servicenow}</span>
                  <button id="copy-sn-btn" class="p-1 text-slate-500 hover:text-brand-primary rounded transition-colors" title="Copiar ServiceNow">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                  ${
                    ticket.servicenow_full_url
                      ? `
                    <a href="${ticket.servicenow_full_url}" target="_blank" class="p-1 text-brand-primary hover:text-brand-primary-hover rounded transition-colors" title="Abrir en ServiceNow">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  `
                      : ''
                  }
                </div>
              `
                : '<span class="text-slate-400 text-xs">No asignado</span>'
            }
          </div>
        </div>
      </div>

      <!-- 4. ATENCIÓN Y TIEMPOS -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="font-montserrat font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Atención y Trazabilidad Operativa
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span class="text-slate-400 block text-[11px]">Turno:</span>
            <span class="font-mono font-bold text-brand-primary">${ticket.turno}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Fecha Creación:</span>
            <span class="font-mono text-slate-700">${ticket.fecha_creacion}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Última Actualización:</span>
            <span class="font-mono text-slate-700">${ticket.fecha_actualizacion || '-'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Fecha de Cierre:</span>
            <span class="font-mono text-slate-700">${ticket.fecha_cierre || 'Pendiente'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Tiempo de Atención:</span>
            <span class="font-montserrat font-bold text-emerald-600">${ticket.tiempo_atencion_formateado || 'En progreso'}</span>
          </div>
        </div>
      </div>

      <!-- 5. HISTORIAL DE AUDITORÍA -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="font-montserrat font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Historial y Auditoría de Cambios
        </h3>
        
        <div class="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-4 py-1">
          ${
            (ticket.historial && ticket.historial.length > 0)
              ? ticket.historial
                  .map(
                    (h) => `
                <div class="relative group">
                  <div class="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-brand-primary ring-4 ring-brand-primary-light"></div>
                  <div class="flex items-center justify-between">
                    <span class="font-montserrat font-bold text-slate-800 text-xs">${h.usuario_nombre}</span>
                    <span class="font-mono text-[10px] text-slate-400">${h.fecha}</span>
                  </div>
                  <p class="text-slate-600 text-xs mt-0.5">${h.descripcion}</p>
                </div>
              `
                  )
                  .join('')
              : `<p class="text-slate-400 text-xs italic">Sin historial adicional registrado.</p>`
          }
        </div>
      </div>
    `;

    // Footer action buttons
    const canDelete = api.hasRole('ADMIN');
    footer.innerHTML = `
      <div class="flex items-center gap-2">
        <button id="detail-edit-btn" class="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-montserrat font-semibold rounded-xl shadow-brand transition-colors flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span>Editar</span>
        </button>

        <button id="detail-change-status-btn" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-montserrat font-semibold rounded-xl transition-colors">
          Cambiar Estado
        </button>
      </div>

      <div class="flex items-center gap-2">
        ${
          canDelete
            ? `
            <button id="detail-delete-btn" class="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-montserrat font-semibold transition-colors flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              <span>Eliminar</span>
            </button>
          `
            : ''
        }

        <button id="detail-back-btn" class="px-3.5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-montserrat font-semibold transition-colors">
          Volver
        </button>
      </div>
    `;

    // Bind event handlers
    drawer.querySelector('#detail-copy-id-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(String(ticket.id));
      toast.success(`ID #${ticket.id} copiado al portapapeles.`);
    });

    drawer.querySelector('#copy-sn-btn')?.addEventListener('click', () => {
      if (ticket.servicenow) {
        navigator.clipboard.writeText(ticket.servicenow);
        toast.success(`ServiceNow ID ${ticket.servicenow} copiado.`);
      }
    });

    drawer.querySelector('#detail-edit-btn')?.addEventListener('click', () => {
      drawer.remove();
      this.onEdit(ticket);
    });

    drawer.querySelector('#detail-back-btn')?.addEventListener('click', () => {
      drawer.remove();
    });

    drawer.querySelector('#detail-change-status-btn')?.addEventListener('click', () => {
      this.openStatusPopup(ticket, drawer);
    });

    drawer.querySelector('#detail-delete-btn')?.addEventListener('click', () => {
      this.confirmDelete(ticket, drawer);
    });
  }

  private openStatusPopup(ticket: Ticket, parentDrawer: HTMLElement): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal border border-slate-100">
        <h3 class="text-base font-montserrat font-bold text-slate-800 mb-2">Cambiar Estado</h3>
        <p class="text-xs font-lato text-slate-500 mb-4">Seleccione el nuevo estado para el Caso #${ticket.id}:</p>

        <div class="space-y-2 mb-6">
          ${['ABIERTO', 'EN PROCESO', 'PENDIENTE', 'RESUELTO', 'CERRADO']
            .map(
              (st) => `
            <button 
              data-new-status-val="${st}" 
              class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/50 text-xs font-montserrat font-bold transition-all flex items-center justify-between group"
            >
              <span>${st}</span>
              <span class="w-2 h-2 rounded-full group-hover:scale-150 transition-transform badge-status-${st.toLowerCase().replace(/\s+/g, '-')}"></span>
            </button>
          `
            )
            .join('')}
        </div>

        <button id="close-status-popup" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-montserrat font-semibold rounded-xl transition-colors">
          Cancelar
        </button>
      </div>
    `;

    modal.querySelectorAll('[data-new-status-val]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const val = btn.getAttribute('data-new-status-val');
        if (val) {
          try {
            await api.changeTicketStatus(ticket.id, val);
            toast.success(`Caso #${ticket.id} actualizado a ${val}`);
            modal.remove();
            parentDrawer.remove();
            this.onStatusChanged();
          } catch (err: any) {
            toast.error(err.message || 'Error al cambiar estado.');
          }
        }
      });
    });

    modal.querySelector('#close-status-popup')?.addEventListener('click', () => modal.remove());
    modalContainer.appendChild(modal);
  }

  private confirmDelete(ticket: Ticket, parentDrawer: HTMLElement): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-modal border border-slate-100 text-center">
        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h3 class="text-base font-montserrat font-bold text-slate-900 mb-1">¿Eliminar el caso #${ticket.id}?</h3>
        <p class="text-xs font-lato text-slate-500 mb-6 leading-relaxed">
          ¿Estás seguro de que deseas eliminar el caso <strong>#${ticket.id}</strong>? Esta acción borrará el registro y todo su historial de auditoría permanentemente.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <button id="cancel-delete-btn" class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-montserrat font-semibold rounded-xl transition-colors">
            Cancelar
          </button>
          <button id="confirm-delete-btn" class="py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-montserrat font-bold rounded-xl shadow-xs transition-colors">
            Sí, eliminar caso
          </button>
        </div>
      </div>
    `;

    modal.querySelector('#cancel-delete-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#confirm-delete-btn')?.addEventListener('click', async () => {
      try {
        await api.deleteTicket(ticket.id);
        toast.success(`Caso #${ticket.id} eliminado correctamente.`);
        modal.remove();
        parentDrawer.remove();
        this.onDelete();
      } catch (err: any) {
        toast.error(err.message || 'Error al eliminar el caso.');
      }
    });

    modalContainer.appendChild(modal);
  }
}
