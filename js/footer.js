/* ==========================================
   FOOTER.JS - Pie de página unificado
   Navegación: Home, Catálogo, Mis Cursos, Progreso, Programas
   ========================================== */

(function () {
    'use strict';

    const LOGO = 'https://i.postimg.cc/c4zrcgBD/Logo-2025-2.png';
    const WA = 'https://wa.me/584121414196?text=Hola,%20tengo%20una%20consulta%20sobre%20los%20cursos.';
    const EMAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=profesorpablocedeno@gmail.com&su=DE%20LA%20PAGINA%20APRENDE%20AUTOMATIZACION';

    function buildFooter() {
        const footer = document.createElement('footer');
        footer.id = 'main-footer';
        footer.innerHTML = `
            <div class="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div class="md:col-span-2">
                    <div class="flex items-center gap-3 mb-4 cursor-pointer" onclick="window.location.href='index.html'">
                        <img src="${LOGO}" alt="Aprende Automatización" class="h-12 w-12 object-contain">
                        <span class="font-black text-lg uppercase tracking-tight" style="color: var(--text-default);">
                            Aprende <span style="color:#2db8ce;">Automatización</span>
                        </span>
                    </div>
                    <p class="text-sm leading-relaxed max-w-md" style="color: var(--text-secondary);">
                        Formación profesional en automatización industrial: cursos online y presenciales,
                        manuales prácticos y acompañamiento experto para impulsar tu carrera.
                    </p>
                    <div class="flex gap-3 mt-6 flex-wrap">
                        <a class="social-btn" href="${WA}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                        <a class="social-btn" href="${EMAIL}" target="_blank" rel="noopener" aria-label="Correo"><i class="fas fa-envelope"></i></a>
                        <a class="social-btn" href="https://www.instagram.com/aprendeautomatizacion?igsh=eXJpaTMyaXF5YnE1" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a class="social-btn" href="https://www.facebook.com/share/1JK75mEyvU/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a class="social-btn" href="https://www.linkedin.com/in/pablo-cede%C3%B1o-747854394?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        <a class="social-btn" href="https://www.youtube.com/@PabloCedeno-sz9hz" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                        <a class="social-btn" href="https://www.tiktok.com/@aprendeautomatizacion?_r=1&_t=ZS-95htm59ZVLT" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
                    </div>
                </div>

                <div>
                    <h4 class="text-xs font-black uppercase tracking-widest mb-4" style="color:#2db8ce;">Navegación</h4>
                    <ul class="space-y-2">
                        <li><a class="footer-link" href="index.html">Home</a></li>
                        <li><a class="footer-link" href="catalogo.html">Catálogo</a></li>
                        <li><a class="footer-link" href="mis-cursos.html">Mis Cursos</a></li>
                        <li><a class="footer-link" href="progreso.html">Progreso</a></li>
                        <li><a class="footer-link" href="programas.html">Programas</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-xs font-black uppercase tracking-widest mb-4" style="color:#2db8ce;">Contacto</h4>
                    <ul class="space-y-3 text-sm" style="color: var(--text-secondary);">
                        <li class="flex items-center gap-2"><i class="fab fa-whatsapp" style="color:#2db8ce;"></i> +58 412-1414196</li>
                        <li class="flex items-center gap-2"><i class="fas fa-envelope" style="color:#2db8ce;"></i> profesorpablocedeno@gmail.com</li>
                        <li class="flex items-center gap-2"><i class="fas fa-location-dot" style="color:#2db8ce;"></i> Venezuela · Online para todo el mundo</li>
                    </ul>
                </div>
            </div>

            <div class="border-t py-5 text-center text-xs" style="border-color: var(--border-light); color: var(--text-secondary);">
                © <span id="footer-year"></span> Aprende Automatización · Prof. Pablo Cedeño. Todos los derechos reservados.
            </div>

            <!-- Botón administrador -->
            <div id="adminButtonContainerFooter" class="hidden pb-6 text-center">
                <button onclick="if(typeof openAdminPanel === 'function') { openAdminPanel(); }" class="text-slate-500 hover:text-[#2db8ce] transition-colors text-[10px] flex items-center gap-2 font-black tracking-widest uppercase py-2 px-4 rounded-lg hover:bg-white/5 mx-auto">
                    <i class="fas fa-shield-alt"></i> Administrar Cursos
                </button>
            </div>`;

        document.body.appendChild(footer);
        footer.querySelector('#footer-year').textContent = new Date().getFullYear();
    }

    document.addEventListener('DOMContentLoaded', buildFooter);

    /* ==========================================
       CORRECCIÓN DE MOJIBAKE
       ========================================== */
    const mojibakeFixMap = new Map([
        ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
        ['Ã', 'Á'], ['Ã‰', 'É'], ['Ã', 'Í'], ['Ã“', 'Ó'], ['Ãš', 'Ú'],
        ['Ã±', 'ñ'], ['Ã‘', 'Ñ'], ['Ã¼', 'ü'], ['Ãœ', 'Ü'],
        ['Â¿', '¿'], ['Â¡', '¡'], ['Â·', '·'], ['Âº', 'º'], ['Âª', 'ª'],
        ['â€“', '–'], ['â€”', '—'], ['â€˜', '‘'], ['â€™', '’'], ['â€œ', '“'], ['â€', '”'],
        ['â€¢', '•'], ['â€¦', '…'], ['âœ…', '✅'], ['âŒ', '❌'], ['â³', '⏳']
    ]);

    function repairMojibakeText(text) {
        if (!text || (!text.includes('Ã') && !text.includes('Â') && !text.includes('â'))) return text;
        let repaired = text;
        mojibakeFixMap.forEach((value, key) => {
            repaired = repaired.split(key).join(value);
        });
        return repaired;
    }

    function repairMojibakeInDom(root = document.body) {
        if (!root) return;

        if (document.title) {
            document.title = repairMojibakeText(document.title);
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                const parentTag = node.parentElement ? node.parentElement.tagName : '';
                if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentTag)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach(node => {
            const fixed = repairMojibakeText(node.nodeValue);
            if (fixed !== node.nodeValue) node.nodeValue = fixed;
        });

        root.querySelectorAll('*').forEach(el => {
            ['title', 'alt', 'placeholder', 'aria-label', 'download', 'value'].forEach(attr => {
                if (!el.hasAttribute(attr)) return;
                const raw = el.getAttribute(attr);
                const fixed = repairMojibakeText(raw);
                if (fixed !== raw) el.setAttribute(attr, fixed);
            });
        });
    }

    repairMojibakeInDom();

    const mojibakeObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const fixed = repairMojibakeText(node.nodeValue);
                    if (fixed !== node.nodeValue) node.nodeValue = fixed;
                    return;
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    repairMojibakeInDom(node);
                }
            });
        });
    });

    if (document.body) {
        mojibakeObserver.observe(document.body, { childList: true, subtree: true });
    }

    /* ==========================================
       ADMIN VISIBLE SEGÚN USUARIO
       ========================================== */
    function updateFooterAdminUI() {
        const user = JSON.parse(localStorage.getItem('user'));
        const isAdmin = user && user.email && user.email.trim().toLowerCase() === 'pablocdno@gmail.com';
        const btn = document.getElementById('adminButtonContainerFooter');
        if (btn) btn.classList.toggle('hidden', !isAdmin);
    }

    document.addEventListener('DOMContentLoaded', updateFooterAdminUI);

    /* ==========================================
       MODO CLARO - ESTILOS DEL FOOTER
       ========================================== */
    const lightModeFooterStyles = document.createElement('style');
    lightModeFooterStyles.textContent = `
        body.light-mode #main-footer {
            background-color: #e3f1f8 !important;
            border-color: #d3e1e8 !important;
        }
        body.light-mode #main-footer .footer-link,
        body.light-mode #main-footer .social-btn {
            color: #475569 !important;
        }
        body.light-mode #main-footer .social-btn:hover {
            color: #2db8ce !important;
            border-color: #2db8ce !important;
        }
        body.light-mode #main-footer .text-secondary {
            color: #2db8ce !important;
        }
        body.light-mode #main-footer p,
        body.light-mode #main-footer li {
            color: #475569 !important;
        }
    `;
    document.head.appendChild(lightModeFooterStyles);
})();