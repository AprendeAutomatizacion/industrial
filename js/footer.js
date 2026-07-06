// footer.js - Carga el pie de página unificado en todas las páginas

const footerHTML = `
<footer class="bg-[#0f172a] py-12 px-6 text-center border-t border-white/5 relative z-20">
    <div class="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <div class="flex items-center gap-2 cursor-pointer" onclick="window.location.href='index.html'">
            <img src="img/AA (38).webp" class="h-8 w-auto">
            <span class="font-bold uppercase text-xl">
                <span class="text-white">Aprende</span><span class="text-secondary">Automatización</span>
            </span>
        </div>
        
        <!-- REDES SOCIALES -->
        <div class="flex items-center gap-3 flex-wrap justify-center">
            <a href="https://wa.me/584121414196" target="_blank" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30 transition-all hover:-translate-y-1 shadow-sm" title="WhatsApp"><i class="fab fa-whatsapp text-lg"></i></a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=profesorpablocedeno@gmail.com&su=DE%20LA%20PAGINA%20APRENDE%20AUTOMATIZACION" target="_blank" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition-all hover:-translate-y-1 shadow-sm" title="Enviar Correo por Gmail"><i class="fas fa-envelope text-lg"></i></a>
            <a href="https://www.instagram.com/aprendeautomatizacion?igsh=eXJpaTMyaXF5YnE1" target="_blank" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-500/30 transition-all hover:-translate-y-1 shadow-sm" title="Instagram"><i class="fab fa-instagram text-lg"></i></a>
            <a href="https://www.facebook.com/share/1JK75mEyvU/" target="_blank" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-600/30 transition-all hover:-translate-y-1 shadow-sm" title="Facebook"><i class="fab fa-facebook-f text-lg"></i></a>
            <a href="https://www.linkedin.com/in/pablo-cede%C3%B1o-747854394?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all hover:-translate-y-1 shadow-sm" title="LinkedIn"><i class="fab fa-linkedin-in text-lg"></i></a>
            <a href="https://www.youtube.com/@PabloCedeno-sz9hz" target="_blank" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all hover:-translate-y-1 shadow-sm" title="YouTube"><i class="fab fa-youtube text-lg"></i></a>
            <a href="https://www.tiktok.com/@aprendeautomatizacion?_r=1&_t=ZS-95htm59ZVLT" target="_blank" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:border-white/30 transition-all hover:-translate-y-1 shadow-sm" title="TikTok"><i class="fab fa-tiktok text-lg"></i></a>
        </div>

        <p class="text-slate-400 text-[10px] italic font-medium tracking-wide uppercase mt-2">© 2026 Aprende Automatización. Todos los derechos reservados.</p>
        
        <!-- BOTÓN PANEL DE ADMINISTRACIÓN -->
        <div id="adminButtonContainerFooter" class="hidden mt-4 pt-4 border-t border-white/10 w-full md:w-1/2 flex justify-center">
            <button onclick="if(typeof openAdminPanel === 'function') { openAdminPanel(); }" class="text-slate-500 hover:text-[#2db8ce] transition-colors text-[10px] flex items-center gap-2 font-black tracking-widest uppercase py-2 px-4 rounded-lg hover:bg-white/5">
                <i class="fas fa-shield-alt"></i> Administrar Cursos
            </button>
        </div>
    </div>
</footer>
`;

document.body.insertAdjacentHTML('beforeend', footerHTML);

function updateFooterAdminUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const adminEmails = ['pablocdno@gmail.com'];
    const isAdmin = user && user.email && adminEmails.includes(user.email.toLowerCase());
    const btn = document.getElementById('adminButtonContainerFooter');
    if (btn) btn.classList.toggle('hidden', !isAdmin);
}

document.addEventListener('DOMContentLoaded', updateFooterAdminUI);

// Estilos para el pie de página en modo claro
const lightModeFooterStyles = document.createElement('style');
lightModeFooterStyles.textContent = `
    body.light-mode footer {
        background-color: #e3f1f8 !important; /* Fondo gris */
        border-color: #d3e1e8 !important; /* Borde más oscuro */
    }
    body.light-mode footer .text-white,
    body.light-mode footer .text-slate-400 {
        color: #475569 !important; /* Texto gris oscuro */
    }
    body.light-mode footer .text-secondary { color: #2db8ce !important; }
`;
document.head.appendChild(lightModeFooterStyles);