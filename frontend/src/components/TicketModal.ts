import { api } from '../services/api';
import { toast } from '../services/toast';
import { Ticket, Client, Platform, User, PrioridadTicket, EstadoTicket, TurnoTicket } from '../types';

export class TicketModal {
  private ticket: Ticket | null = null;
  private isEdit: boolean = false;
  private clients: Client[] = [];
  private platforms: Platform[] = [];
  private agents: User[] = [];
  private onSuccess: () => void;

  constructor(options: {
    ticket?: Ticket | null;
    clients: Client[];
    platforms: Platform[];
    agents: User[];
    onSuccess: () => void;
  }) {
    this.ticket = options.ticket || null;
    this.isEdit = !!options.ticket;
    this.clients = options.clients.filter((c) => c.estado === 'ACTIVO');
    this.platforms = options.platforms.filter((p) => p.estado === 'ACTIVO');
    this.agents = options.agents || [];
    this.onSuccess = options.onSuccess;
  }

  public open(): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in';

    const isAdmin = api.hasRole('ADMIN');

    const defaultDate = this.ticket?.fecha_creacion
      ? this.ticket.fecha_creacion.slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-3xl w-full shadow-modal border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-brand">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <h2 class="text-base font-montserrat font-bold">${this.isEdit ? `Editar Caso #${this.ticket?.id}` : 'Registrar Nuevo Caso de Soporte'}</h2>
              <p class="text-[11px] font-lato text-slate-300">Complete los campos requeridos para la gestión del ticket</p>
            </div>
          </div>
          <button id="modal-close-btn" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <form id="ticket-form" class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          <!-- SECCIÓN 1: INFORMACIÓN DEL CASO -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span class="w-5 h-5 rounded-full bg-brand-primary-light text-brand-primary font-montserrat font-bold flex items-center justify-center text-[10px]">1</span>
              <h3 class="font-montserrat font-bold text-slate-800 text-sm">Información del Caso y Solicitud</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Prioridad (Badges Selector) -->
              <div>
                <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                  Prioridad <span class="text-rose-500">*</span>
                </label>
                <div class="grid grid-cols-4 gap-1.5" id="prio-selector">
                  ${['MEDIO', 'ALTO', 'BAJO', 'CRITICO'].map((p) => {
                    const isSelected = (this.ticket?.prioridad || 'MEDIO') === p;
                    return `
                      <button 
                        type="button" 
                        data-prio-val="${p}" 
                        class="prio-badge-btn py-2 px-1 text-center font-montserrat font-bold text-[10px] rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-brand-primary text-white border-brand-primary shadow-xs ring-2 ring-brand-primary/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }"
                      >
                        ${p}
                      </button>
                    `;
                  }).join('')}
                </div>
                <input type="hidden" name="prioridad" id="form-prioridad" value="${this.ticket?.prioridad || 'MEDIO'}" />
              </div>

              <!-- Plataforma Tecnológica -->
              <div>
                <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                  Plataforma <span class="text-rose-500">*</span>
                </label>
                <select name="plataforma_id" id="form-plataforma" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" required>
                  <option value="">Seleccione una plataforma...</option>
                  ${this.platforms.map((p) => `
                    <option value="${p.id}" ${this.ticket?.plataforma_id === p.id ? 'selected' : ''}>${p.nombre}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Cliente -->
              <div>
                <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                  Cliente / Empresa <span class="text-rose-500">*</span>
                </label>
                <select name="cliente_id" id="form-cliente" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" required>
                  <option value="">Seleccione la empresa...</option>
                  ${this.clients.map((c) => `
                    <option value="${c.id}" ${this.ticket?.cliente_id === c.id ? 'selected' : ''}>${c.nombre}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Nombre del Solicitante -->
              <div>
                <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                  Nombre del Solicitante <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="solicitante" 
                  id="form-solicitante" 
                  value="${this.ticket?.solicitante || ''}" 
                  placeholder="Ej. Jimmy Pardo, Andrea Gómez..." 
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" 
                  required 
                />
              </div>
            </div>

            <!-- Asunto del Correo -->
            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                Asunto del Correo Electrónico <span class="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                name="asunto" 
                id="form-asunto" 
                value="${this.ticket?.asunto || ''}" 
                placeholder="Ej. HABILITACIÓN DE PROGRAMA Y LIBRERÍAS..." 
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" 
                required 
              />
            </div>

            <!-- Descripción Amplia -->
            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                Descripción Completa de la Solicitud <span class="text-rose-500">*</span>
              </label>
              <textarea 
                name="descripcion" 
                id="form-descripcion" 
                rows="4" 
                placeholder="Detalle los requerimientos técnicos, mensajes de error, servidores o estaciones afectadas..." 
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato leading-relaxed focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" 
                required
              >${this.ticket?.descripcion || ''}</textarea>
            </div>
          </div>

          <!-- SECCIÓN 2: INFORMACIÓN DE ATENCIÓN -->
          <div class="space-y-4 pt-2">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span class="w-5 h-5 rounded-full bg-brand-primary-light text-brand-primary font-montserrat font-bold flex items-center justify-center text-[10px]">2</span>
              <h3 class="font-montserrat font-bold text-slate-800 text-sm">Información Operativa y Atención</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               <!-- Turno -->
               <div>
                 <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                   Turno Atendido <span class="text-rose-500">*</span>
                 </label>
                 <select name="turno" id="form-turno" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" required>
                   ${['NA', 'T1', 'T2', 'T4', 'TD', 'TN'].map((t) => `
                     <option value="${t}" ${this.ticket?.turno === t ? 'selected' : ''}>${t}</option>
                   `).join('')}
                 </select>
               </div>

               <!-- Agente -->
               <div>
                 <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                   Agente de Atención <span class="text-rose-500">*</span>
                 </label>
                 <select name="agente_id" id="form-agente" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" required>
                   <option value="">Seleccione un agente...</option>
                   ${this.agents.map((a) => `
                     <option value="${a.id}" ${this.ticket?.agente_id === a.id ? 'selected' : ''}>${a.nombre}</option>
                   `).join('')}
                 </select>
               </div>

              <!-- Estado -->
              <div>
                <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                  Estado <span class="text-rose-500">*</span>
                </label>
                <select name="estado" id="form-estado" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-lato focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" required>
                  ${['ABIERTO', 'EN PROCESO', 'PENDIENTE', 'RESUELTO', 'CERRADO'].map((s) => `
                    <option value="${s}" ${(this.ticket?.estado || 'ABIERTO') === s ? 'selected' : ''}>${s}</option>
                  `).join('')}
                </select>
              </div>

              <!-- ServiceNow ID -->
              <div>
                <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                  ServiceNow ID
                </label>
                <input 
                  type="text" 
                  name="servicenow" 
                  id="form-servicenow" 
                  value="${this.ticket?.servicenow || ''}" 
                  placeholder="Ej. CS0001252074" 
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none uppercase" 
                />
              </div>

              <!-- Fecha de Creación -->
              <div class="${isAdmin ? '' : 'opacity-75'}">
                <label class="block font-montserrat font-semibold text-slate-700 mb-1.5">
                  Fecha Creación ${isAdmin ? '' : '(Automática)'}
                </label>
                <input 
                  type="datetime-local" 
                  name="fecha_creacion" 
                  id="form-fecha-creacion" 
                  value="${defaultDate}" 
                  ${isAdmin ? '' : 'readonly'}
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:outline-none" 
                />
              </div>
            </div>
          </div>
        </form>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 flex-shrink-0">
          <button 
            type="button" 
            id="modal-cancel-btn" 
            class="px-4 py-2 text-xs font-montserrat font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button 
            type="submit" 
            form="ticket-form" 
            id="modal-submit-btn" 
            class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-montserrat font-bold rounded-xl shadow-brand transition-all flex items-center gap-2 transform active:scale-95"
          >
            <span>${this.isEdit ? 'Actualizar caso' : 'Guardar caso'}</span>
          </button>
        </div>
      </div>
    `;

    // Priority selector buttons
    modal.querySelectorAll('.prio-badge-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-prio-val');
        if (val) {
          (modal.querySelector('#form-prioridad') as HTMLInputElement).value = val;
          modal.querySelectorAll('.prio-badge-btn').forEach((b) => {
            b.className = 'prio-badge-btn py-2 px-1 text-center font-montserrat font-bold text-[10px] rounded-xl border transition-all bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
          });
          btn.className = 'prio-badge-btn py-2 px-1 text-center font-montserrat font-bold text-[10px] rounded-xl border transition-all bg-brand-primary text-white border-brand-primary shadow-xs ring-2 ring-brand-primary/20';
        }
      });
    });

    // Close & Cancel
    const closeModal = () => modal.remove();
    modal.querySelector('#modal-close-btn')?.addEventListener('click', closeModal);
    modal.querySelector('#modal-cancel-btn')?.addEventListener('click', closeModal);

    // Form Submit
    const form = modal.querySelector('#ticket-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = modal.querySelector('#modal-submit-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Guardando...</span>`;

      try {
        const formData = new FormData(form);
        const data: any = {
          prioridad: formData.get('prioridad'),
          plataforma_id: Number(formData.get('plataforma_id')),
          cliente_id: Number(formData.get('cliente_id')),
          solicitante: formData.get('solicitante'),
          asunto: formData.get('asunto'),
          descripcion: formData.get('descripcion'),
          turno: formData.get('turno'),
          agente_id: Number(formData.get('agente_id')),
          estado: formData.get('estado'),
          servicenow: formData.get('servicenow') || null,
          fecha_creacion: formData.get('fecha_creacion') ? String(formData.get('fecha_creacion')).replace('T', ' ') + ':00' : undefined
        };

        if (this.isEdit && this.ticket) {
          await api.updateTicket(this.ticket.id, data);
          toast.success(`Caso #${this.ticket.id} actualizado exitosamente.`);
        } else {
          const res = await api.createTicket(data);
          toast.success(`Caso #${res.data?.id} creado exitosamente.`);
        }

        closeModal();
        this.onSuccess();
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar el caso.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>${this.isEdit ? 'Actualizar caso' : 'Guardar caso'}</span>`;
      }
    });

    modalContainer.appendChild(modal);
  }
}
