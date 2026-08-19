import { api } from '../services/api';
import { toast } from '../services/toast';

export class LoginModal {
  private onSuccess: () => void;

  constructor(onSuccess: () => void) {
    this.onSuccess = onSuccess;
  }

  public open(): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <!-- Header -->
        <div class="p-6 bg-gradient-to-br from-brand-dark via-brand-dark to-[#0f1738] text-white text-center relative">
          <button id="close-login-btn" class="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-cyan text-white flex items-center justify-center mx-auto mb-3 shadow-brand">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h2 class="text-xl font-montserrat font-bold tracking-tight">Support Desk</h2>
          <p class="text-xs font-lato text-slate-300 mt-0.5">Ingreso seguro a la plataforma de gestión de casos</p>
        </div>

        <div class="p-6 space-y-5">
          <!-- 1-Click Demo Profiles -->
          <div>
            <span class="block text-[11px] font-montserrat font-bold text-slate-400 uppercase tracking-wider mb-2">
              Acceso Rápido / Cuentas Demo
            </span>
            <div class="grid grid-cols-2 gap-2">
              <button 
                data-demo-email="admin@supportdesk.com" 
                data-demo-pass="admin123"
                class="demo-login-btn p-2.5 rounded-xl border border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/40 text-left transition-all group"
              >
                <div class="font-montserrat font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Administrador</span>
                  <span class="text-[9px] bg-brand-primary-light text-brand-primary px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                </div>
                <span class="text-[10px] text-slate-400 truncate block mt-0.5 font-mono">admin@...</span>
              </button>

              <button 
                data-demo-email="didier.santamaria@supportdesk.com" 
                data-demo-pass="agente123"
                class="demo-login-btn p-2.5 rounded-xl border border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/40 text-left transition-all group"
              >
                <div class="font-montserrat font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Didier S.</span>
                  <span class="text-[9px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-bold">AGENTE</span>
                </div>
                <span class="text-[10px] text-slate-400 truncate block mt-0.5 font-mono">didier.s...@...</span>
              </button>

              <button 
                data-demo-email="bryan.sanchez@supportdesk.com" 
                data-demo-pass="agente123"
                class="demo-login-btn p-2.5 rounded-xl border border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/40 text-left transition-all group"
              >
                <div class="font-montserrat font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Bryan S.</span>
                  <span class="text-[9px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-bold">AGENTE</span>
                </div>
                <span class="text-[10px] text-slate-400 truncate block mt-0.5 font-mono">bryan.s...@...</span>
              </button>

              <button 
                data-demo-email="consulta@supportdesk.com" 
                data-demo-pass="consulta123"
                class="demo-login-btn p-2.5 rounded-xl border border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/40 text-left transition-all group"
              >
                <div class="font-montserrat font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Auditor</span>
                  <span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">CONSULTA</span>
                </div>
                <span class="text-[10px] text-slate-400 truncate block mt-0.5 font-mono">consulta@...</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="h-px bg-slate-200 flex-1"></div>
            <span class="text-[11px] text-slate-400 font-lato">o ingresa con tus credenciales</span>
            <div class="h-px bg-slate-200 flex-1"></div>
          </div>

          <!-- Login Form -->
          <form id="login-form" class="space-y-4 text-xs font-lato">
            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                id="login-email" 
                name="email" 
                required 
                placeholder="tu.correo@empresa.com" 
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" 
              />
            </div>

            <div>
              <label class="block font-montserrat font-semibold text-slate-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                id="login-password" 
                name="password" 
                required 
                placeholder="••••••••" 
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" 
              />
            </div>

            <button 
              type="submit" 
              id="login-submit-btn" 
              class="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 transform active:scale-98"
            >
              <span>Iniciar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-login-btn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Form submit
    const form = modal.querySelector('#login-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (modal.querySelector('#login-email') as HTMLInputElement)?.value;
      const pass = (modal.querySelector('#login-password') as HTMLInputElement)?.value;

      const btn = modal.querySelector('#login-submit-btn') as HTMLButtonElement;
      btn.disabled = true;
      btn.innerHTML = `<span>Iniciando sesión...</span>`;

      try {
        const res = await api.login(email, pass);
        toast.success(`Bienvenido, ${res.data?.user.nombre}`);
        closeModal();
        this.onSuccess();
      } catch (err: any) {
        toast.error(err.message || 'Error al iniciar sesión.');
        btn.disabled = false;
        btn.innerHTML = `<span>Iniciar Sesión</span>`;
      }
    });

    // Demo buttons
    modal.querySelectorAll('.demo-login-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-demo-email') || '';
        const pass = btn.getAttribute('data-demo-pass') || '';

        const emailInput = modal.querySelector('#login-email') as HTMLInputElement;
        const passInput = modal.querySelector('#login-password') as HTMLInputElement;

        if (emailInput) emailInput.value = email;
        if (passInput) passInput.value = pass;

        // Auto submit
        form.dispatchEvent(new Event('submit'));
      });
    });

    modalContainer.appendChild(modal);
  }
}
