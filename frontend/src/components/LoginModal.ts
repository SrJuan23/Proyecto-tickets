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
          <h2 class="text-xl font-montserrat font-bold tracking-tight">Huella de soporte</h2>
          <p class="text-xs font-lato text-slate-300 mt-0.5">Registro de casos</p>
        </div>

        <div class="p-6 space-y-5">
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

    modalContainer.appendChild(modal);
  }
}
