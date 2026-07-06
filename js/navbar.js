// navbar.js - Carga el menú de navegación en todas las páginas

    // Inyectar librería de Confeti
    const confettiScript = document.createElement('script');
    confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    document.head.appendChild(confettiScript);

    // Funciones globales de Gamificación
    window.triggerConfetti = function() {
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#02d6fe', '#1877f2', '#ffffff']
            });
        }
    };

    window.playSuccessSound = function() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {}); // Ignorar si el navegador bloquea el auto-play
    };

    // Obtener el nombre de la página actual
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Verificar si el usuario ha iniciado sesión
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch(e) { user = null; }
    const isLogged = !!user;

    // Lógica de Tema
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light-mode', savedTheme === 'light');

    window.toggleTheme = function() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        const icon = document.getElementById('theme-icon');
        const themeButton = icon ? icon.closest('button') : null;
        if(icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        if(themeButton) themeButton.title = isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro';
    };

    // Helper para generar Skeletons
    window.createSkeletonHTML = function(type, count = 3) {
        let html = '';
        for(let i=0; i<count; i++) {
            if(type === 'course') {
                html += `
                <div class="bg-white/5 rounded-[24px] overflow-hidden border border-white/10 p-2 animate-pulse">
                    <div class="h-48 bg-slate-700/20 rounded-[20px] mb-4"></div>
                    <div class="p-4 space-y-3">
                        <div class="h-6 bg-slate-700/20 rounded w-3/4"></div>
                        <div class="h-4 bg-slate-700/20 rounded w-full"></div>
                        <div class="h-10 bg-slate-700/20 rounded-xl mt-4"></div>
                    </div>
                </div>`;
            } else if(type === 'comment') {
                html += `
                <div class="p-5 rounded-2xl border border-white/5 bg-white/5 animate-pulse mb-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-slate-700/20"></div>
                        <div class="space-y-2 flex-grow">
                            <div class="h-3 bg-slate-700/20 rounded w-1/4"></div>
                            <div class="h-2 bg-slate-700/20 rounded w-1/6"></div>
                        </div>
                    </div>
                    <div class="h-3 bg-slate-700/20 rounded w-full mb-2"></div>
                    <div class="h-3 bg-slate-700/20 rounded w-5/6"></div>
                </div>`;
            } else if(type === 'rank') {
                html += `<div class="h-14 bg-white/5 rounded-2xl animate-pulse mb-3"></div>`;
            }
        }
        return html;
    };

    // Estilos para Modo Claro y Skeletons
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.15); } }
        
        /* Sobrescrituras Modo Oscuro (Predeterminado) */
        body:not(.light-mode) { 
            background-color: #1c2839 !important; 
            color: #ffffff !important; /* Letras blancas en modo oscuro */
        }

        /* Header, Pie de página y secciones oscuras: #0b1320 */
        body:not(.light-mode) .bg-slate-900, 
        body:not(.light-mode) .bg-gray-900,
        body:not(.light-mode) footer,
        body:not(.light-mode) .bg-\\[\\#0f172a\\] { 
            background-color: #0b1320 !important; 
            color: #ffffff !important;
        }
        body:not(.light-mode) nav.global-navbar { background: rgba(5, 15, 27, 0.85) !important; }

        /* Estilos de Tarjetas en Modo Oscuro (Catálogo, Mis Cursos, Aulas, Programas) */
        body:not(.light-mode) .app-card,
        body:not(.light-mode) .course-card,
        body:not(.light-mode) .materia-card,
        body:not(.light-mode) .resource-card,
        body:not(.light-mode) .glass-light,
        body:not(.light-mode) .glass-dark-blue,
        body:not(.light-mode) .glass-gray-blue,
        body:not(.light-mode) #programsGrid > div,
        body:not(.light-mode) main .bg-white,
        body:not(.light-mode) .bg-slate-50 {
            background-color: #2e3a50 !important; 
            border-color: #4a5568 !important; /* Borde más oscuro */
            color: #ffffff !important; /* Texto blanco */
        }

        /* Títulos en Modo Oscuro */
        body:not(.light-mode) h1, body:not(.light-mode) h2, 
        body:not(.light-mode) h3, body:not(.light-mode) h4,
        body:not(.light-mode) .text-slate-900 {
            color: #ffffff !important;
        }

        /* Forzar Panel de Administración a MODO CLARO siempre */
        body:not(.light-mode) #adminModal .bg-slate-50,
        body:not(.light-mode) #adminModal .bg-white {
            background-color: #f8fafc !important;
            color: #334155 !important;
        }
        body:not(.light-mode) #adminModal * {
            color: #334155 !important;
        }
        body:not(.light-mode) #adminModal .text-white { color: #ffffff !important; }
        body:not(.light-mode) #adminModal .text-slate-400 { color: #64748b !important; }
        body:not(.light-mode) #adminModal .text-slate-500 { color: #64748b !important; }
        body:not(.light-mode) #adminModal .text-slate-600 { color: #475569 !important; }
        body:not(.light-mode) #adminModal .text-slate-800 { color: #1e293b !important; }
        body:not(.light-mode) #adminModal .text-slate-900 { color: #0f172a !important; }
        body:not(.light-mode) #adminModal .border-slate-200 { border-color: #e2e8f0 !important; }
        body:not(.light-mode) #adminModal input,
        body:not(.light-mode) #adminModal select {
            background-color: #ffffff !important;
        }

        /* Asegurar que los botones dentro de la tarjeta de manuales sean blancos en modo oscuro */
        body:not(.light-mode) #mcManualsCard button:not(.bg-green-50),
        body:not(.light-mode) #mcManualsCard button:not(.bg-green-50) { background-color: #ffffff !important; border-color: #e2e8f0 !important; }

        /* Forzar texto blanco en contenido de tarjetas de páginas info en modo oscuro */
        body:not(.light-mode) .glass-dark-blue ul,
        body:not(.light-mode) .glass-gray-blue ul,
        body:not(.light-mode) .glass-gray-blue,
        body:not(.light-mode) .text-slate-700,
        body:not(.light-mode) .text-slate-800 { color: #ffffff !important; }

        body:not(.light-mode) .course-card p,
        body:not(.light-mode) .materia-card p,
        body:not(.light-mode) .text-slate-600 {
            color: #ffffff !important; /* Texto blanco en modo oscuro solicitado */
        }

        /* Forzar texto gris oscuro en la pastilla de nivel del curso */
        body .course-card span.bg-slate-100.text-slate-600 {
            color: #1e293b !important; /* Gris muy oscuro, casi negro */
        }

        /* Ajuste específico para el texto del nivel del curso en modo oscuro */
        body:not(.light-mode) .course-card span.bg-slate-100.text-slate-600 {
            background-color: #0f172a !important; /* Azul oscuro de fondo */
            color: #ffffff !important; /* Letras blancas */
            border-color: #2db8ce !important; /* Borde celeste para acentuar */
        }

        /* Ajustes de badges y elementos internos */
        body:not(.light-mode) .bg-cyan-500,
        body:not(.light-mode) .bg-emerald-500 {
            background-color: #2db8ce !important;
            color: white !important;
        }

        /* Sobrescrituras Modo Claro */
        body.light-mode {
            background-color: #7e96ab !important;
            color: #334155 !important;
        }

        /* Fondos de sección para modo claro */
        body.light-mode .section-themed {
            background-color: transparent !important;
            border-color: transparent !important;
        }
        body.light-mode .section-themed .section-title,
        body.light-mode .section-themed .section-subtitle,
        body.light-mode #comunidad p { /* Específico para el párrafo de la sección comunidad */
            color: #ffffff !important;
        }
        body.light-mode .section-themed .section-title span { color: #02d6fe !important; }

        /* Estilos para tarjetas y encabezados en modo claro */
        body.light-mode .bg-white\\/10,
        body.light-mode .bg-\\[\\#0f172a\\]\\/60 {
            background-color: rgba(241, 245, 249, 0.30) !important; /* slate-50 translúcido */
            border-color: rgba(226, 232, 240, 0.9) !important; /* slate-200 casi sólido */
        }
        /* Ajustar imagen de fondo de encabezados en modo claro */
        body.light-mode .bg-white\\/10 > .absolute.inset-0.z-0 img {
            mix-blend-mode: soft-light !important;
            opacity: 0.4 !important;
        }
        body.light-mode .bg-white\\/10 .text-white,
        body.light-mode .bg-white\\/10 .text-blue-50 {
             color: #1e293b !important; /* slate-800, texto principal oscuro */
        }
        body.light-mode .bg-white\\/10 .text-slate-300,
        body.light-mode .bg-white\\/10 .text-slate-400 {
             color: #64748b !important; /* slate-500, texto secundario gris */
        }
        body.light-mode .bg-white\\/10 .text-\\[\\#2db8ce\\],

        /* Estilos para badges dentro de tarjetas/encabezados en modo claro */
        body.light-mode .bg-blue-500\\/20 { background-color: #eff6ff !important; border-color: #dbeafe !important; backdrop-filter: none !important; }
        body.light-mode .text-blue-400 { color: #2563eb !important; }
        body.light-mode .border-blue-500\\/30 { border-color: #bfdbfe !important; }
        body.light-mode .bg-red-500\\/20 { background-color: #fef2f2 !important; border-color: #fee2e2 !important; backdrop-filter: none !important; }
        body.light-mode .text-red-400 { color: #dc2626 !important; }
        body.light-mode .border-red-500\\/30 { border-color: #fecaca !important; }
        body.light-mode .bg-emerald-500\\/20 { background-color: #ecfdf5 !important; border-color: #d1fae5 !important; backdrop-filter: none !important; }
        body.light-mode .text-emerald-400 { color: #059669 !important; }
        body.light-mode .border-emerald-500\\/30 { border-color: #a7f3d0 !important; }
        body.light-mode .bg-slate-500\\/20 { background-color: #f1f5f9 !important; border-color: #e2e8f0 !important; backdrop-filter: none !important; }
        body.light-mode .border-slate-500\\/30 { border-color: #cbd5e1 !important; }

        /* Estilos para Desglose de Módulos (página Progreso) en modo claro */
        body.light-mode .bg-blue-900\\/30,
        body.light-mode .bg-red-900\\/30,
        body.light-mode .bg-slate-700\\/30 {
            background-color: #ffffff !important;
        }
        body.light-mode .bg-blue-900\\/30, body.light-mode .bg-blue-900\\/30 *,
        body.light-mode .bg-red-900\\/30, body.light-mode .bg-red-900\\/30 * {
            color: #1e293b !important; /* slate-800 */
        }
        body.light-mode .bg-slate-700\\/30, body.light-mode .bg-slate-700\\/30 * {
            color: #475569 !important; /* slate-600 */
        }
        body.light-mode .border-blue-500\\/50 { border-color: #bfdbfe !important; }
        body.light-mode .border-red-500\\/50 { border-color: #fca5a5 !important; }
        body.light-mode .border-slate-500\\/50 { border-color: #cbd5e1 !important; }

        /* Estilos para tarjeta de Logros (página Progreso) en modo claro */
        body.light-mode .bg-\\[\\#0f172a\\]\\/60 .text-slate-400 {
            color: #475569 !important; /* slate-600 */
        }
        body.light-mode #achievements-container .bg-blue-500\\/20 {
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important; /* slate-200 */
            backdrop-filter: none !important;
        }
        body.light-mode #achievements-container .text-white {
            color: #475569 !important; /* slate-600, gris oscuro */
        }
        body.light-mode #achievements-container .text-green-400 {
            color: #16a34a !important; /* green-600 */
        }

        /* Estilos para Resumen del Curso en modo claro */
        body.light-mode .glass-light,
        body.light-mode #page-curso-detalle .bg-slate-50 {
            background-color: #ffffff !important;
        }

        body.light-mode nav.global-navbar { 
            background: #e3f1f8 !important; 
            border-bottom: 1px solid #d3e1e8 !important; 
        }

        /* Fondo de tarjetas en modo claro */
        body.light-mode .course-card,
        body.light-mode #programsGrid > div {
            background-color: #e3f1f8 !important;
            border-color: #d3e1e8 !important;
        }
        /* Corrección de texto para tarjetas en modo claro */
        body.light-mode .course-card h2, body.light-mode .course-card h3,
        body.light-mode #programsGrid h2,
        body.light-mode #programsGrid .text-white {
            color: #1e293b !important;
        }
        body.light-mode .course-card p, body.light-mode #programsGrid p,
        body.light-mode #programsGrid .text-slate-300 {
            color: #475569 !important;
        }

        /* Corrección de pastillas para programas.html en modo claro */
        body.light-mode #programsGrid .bg-white\\/10 { background-color: #40a0db66 !important; border-color: rgba(255,255,255,0.5) !important; }
        body.light-mode #programsGrid .bg-blue-500\\/20 { background-color: #bfdbfe !important; }
        body.light-mode #programsGrid .text-blue-300 { color: #2563eb !important; }
        body.light-mode #programsGrid .border-blue-500\\/30 { border-color: #93c5fd !important; }
        body.light-mode #programsGrid .bg-emerald-500\\/20 { background-color: #a7f3d0 !important; }
        body.light-mode #programsGrid .text-emerald-300 { color: #059669 !important; }
        body.light-mode #programsGrid .border-emerald-500\\/30 { border-color: #6ee7b7 !important; }
        body.light-mode #programsGrid .bg-sky-500\\/20 { background-color: #e0f2fe !important; }
        body.light-mode #programsGrid .text-sky-300 { color: #0284c7 !important; }
        body.light-mode #programsGrid .border-sky-500\\/30 { border-color: #7dd3fc !important; }

        body.light-mode #navbarAuthBtn, body.light-mode #authBtnText, body.light-mode #navbarAuthBtn i { color: #334155 !important; }
        
        /* Icono de cambio de tema en gris oscuro en modo claro */
        body.light-mode #theme-icon, body.light-mode nav button[onclick="toggleTheme()"] { color: #334155 !important; }
        
        /* Identidad Visual Global: Aprende (Variable) Automatización (Azul Claro #02d6fe) */
        .logo-text { color: #ffffff !important; }
        body.light-mode .logo-text { color: #334155 !important; }
        .logo-text span, .logo-text span span, .logo-text span i { color: #02d6fe !important; }
        
        body.light-mode .force-white-text {
            color: #ffffff !important;
        }
        
        /* Títulos con el azul claro corporativo (#2db8ce) forzado */
        #cursos-destacados h2 span, 
        #testimonios h2 span,
        #comunidad h2 span,
        #mision h2 span,
        .featured-title, 
        .testimonials-title {
            color: #02d6fe !important;
        }

        /* ================================================= */
        /* === ESTILO DE BOTONES UNIFICADO (PLATEADO/LED) === */
        /* ================================================= */
        .btn-metal {
            transition: all 0.2s ease-out !important;
            text-transform: uppercase !important;
            font-weight: 800 !important;
            letter-spacing: 0.05em !important;
            border-radius: 12px !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 24px;
            cursor: pointer;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .btn-metal:active { transform: scale(0.97); }

        /* --- LIGHT MODE --- */
        body.light-mode .btn-metal {
            background: linear-gradient(to bottom, #f0f5f9, #d9e0e6) !important;
            border: 1px solid #c1c9d1 !important;
            box-shadow: inset 0 1px 0 #f5f9fa, 0 1px 3px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.1) !important;
            text-shadow: 0 1px 0 rgba(255,255,255,0.5);
        }
        body.light-mode .btn-metal:hover { background: linear-gradient(to bottom, #f5f9fa, #e0e7ed) !important; }
        body.light-mode .btn-metal:active { box-shadow: inset 0 2px 3px rgba(0,0,0,0.15) !important; }

        /* --- DARK MODE --- */
        body:not(.light-mode) .btn-metal {
            background: linear-gradient(to bottom, #4a5568, #2d3748) !important;
            border: 1px solid #1a202c !important;
            box-shadow: inset 0 1px 1px #718096, 0 1px 3px rgba(0,0,0,0.5) !important;
            text-shadow: 0 1px 1px rgba(0,0,0,0.5);
        }
        body:not(.light-mode) .btn-metal:hover { background: linear-gradient(to bottom, #5a6578, #3d4758) !important; }
        body:not(.light-mode) .btn-metal:active { box-shadow: inset 0 2px 4px rgba(0,0,0,0.4) !important; }

        /* --- LED & TEXT COLORS --- */
        .btn-metal i { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

        /* Cyan (Default) */
        body.light-mode .btn-cyan { color: #0891b2 !important; }
        body.light-mode .btn-cyan i { text-shadow: 0 0 8px rgba(8, 145, 178, 0.7); }
        body:not(.light-mode) .btn-cyan { color: #2db8ce !important; }
        body:not(.light-mode) .btn-cyan i { text-shadow: 0 0 10px rgba(45, 184, 206, 0.8); }

        /* Slate (Gray) */
        body.light-mode .btn-slate { color: #475569 !important; }
        body.light-mode .btn-slate i { text-shadow: none !important; }
        body:not(.light-mode) .btn-slate { color: #e2e8f0 !important; }
        body:not(.light-mode) .btn-slate i { text-shadow: none !important; }

        /* Blue */
        body.light-mode .btn-blue { color: #2563eb !important; }
        body.light-mode .btn-blue i { text-shadow: 0 0 10px rgba(37, 99, 235, 0.6); }
        body:not(.light-mode) .btn-blue { color: #60a5fa !important; }
        body:not(.light-mode) .btn-blue i { text-shadow: 0 0 10px rgba(96, 165, 250, 0.7); }

        /* Green */
        body.light-mode .btn-green { color: #16a34a !important; }
        body.light-mode .btn-green i { text-shadow: 0 0 10px rgba(22, 163, 74, 0.6); }
        body:not(.light-mode) .btn-green { color: #22c55e !important; }
        body:not(.light-mode) .btn-green i { text-shadow: 0 0 10px rgba(34, 197, 94, 0.7); }

        /* Red */
        body.light-mode .btn-red { color: #dc2626 !important; }
        body.light-mode .btn-red i { text-shadow: 0 0 10px rgba(220, 38, 38, 0.6); }
        body:not(.light-mode) .btn-red { color: #f87171 !important; }
        body:not(.light-mode) .btn-red i { text-shadow: 0 0 10px rgba(248, 113, 113, 0.7); }

        /* --- OUTLINE VARIANT --- */
        .btn-metal-outline { background: transparent !important; border-width: 2px !important; }
        body.light-mode .btn-metal-outline.btn-cyan { border-color: #0891b2 !important; color: #0891b2 !important; }
        body:not(.light-mode) .btn-metal-outline.btn-cyan { border-color: #2db8ce !important; color: #2db8ce !important; }
        body.light-mode .btn-metal-outline:hover { background: rgba(8, 145, 178, 0.05) !important; }
        body:not(.light-mode) .btn-metal-outline:hover { background: rgba(45, 184, 206, 0.05) !important; }

        /* --- ICON-ONLY VARIANT --- */
        .btn-metal-icon { padding: 0 !important; width: 40px; height: 40px; border-radius: 9999px !important; }

        /* --- NAVBAR SPECIFIC STYLES --- */
        .nav-item { padding: 8px 14px; font-size: 11px; }
        body:not(.light-mode) .nav-item.active {
            background: linear-gradient(to top, #3d4758, #2d3748) !important;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 0 15px rgba(45, 184, 206, 0.2) !important;
        }
        body.light-mode .nav-item.active {
            background: linear-gradient(to top, #e8eff5, #d1d9e0) !important;
            box-shadow: inset 0 2px 3px rgba(0,0,0,0.1) !important;
        }

        /* Estilo unificado de la pastilla de carga (Sync Indicator) */
        .sync-indicator {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100001;
            background: #0f172a;
            color: white;
            padding: 8px 20px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transition: all 0.4s ease;
            opacity: 0;
            pointer-events: none;
        }
        .sync-indicator.visible { opacity: 1; pointer-events: auto; }
        .sync-indicator.success { background: #059669; }
        .sync-indicator.error { background: #dc2626; }
    `;
    document.head.appendChild(style);

    // Funciones globales para la pastilla de carga unificada
    window.showSyncIndicator = function(text, type = 'loading') {
        let el = document.getElementById('syncIndicator');
        if (!el) {
            document.body.insertAdjacentHTML('beforeend', '<div id="syncIndicator" class="sync-indicator"><i class="fas fa-sync-alt fa-spin text-[#2db8ce]"></i><span id="syncText"></span></div>');
            el = document.getElementById('syncIndicator');
        }
        const txt = document.getElementById('syncText');
        const icon = el.querySelector('i');
        el.classList.remove('success', 'error', 'visible');
        txt.innerText = text;
        if (type === 'success') { el.classList.add('success', 'visible'); icon.className = 'fas fa-check-circle text-green-300'; }
        else if (type === 'error') { el.classList.add('error', 'visible'); icon.className = 'fas fa-exclamation-circle text-red-300'; }
        else { el.classList.add('visible'); icon.className = 'fas fa-sync-alt fa-spin text-[#2db8ce]'; }
        if (type !== 'loading') { setTimeout(() => el.classList.remove('visible', 'success', 'error'), 3000); }
    };

    window.hideSyncIndicator = function() {
        const el = document.getElementById('syncIndicator');
        if (el) el.classList.remove('visible', 'success', 'error');
    };

    const navbarHTML = `
    <nav class="global-navbar" style="position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(45, 184, 206, 0.25); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);">
        <div style="max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 12px 20px;">
            
            <!-- LOGO -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <button id="hamburger-btn" style="display: none; background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 10px 0 0;">
                    <i class="fas fa-bars"></i>
                </button>
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="window.location.href='index.html'">
                <img src="img/AA (38).webp" alt="Logo" style="height: 38px;">
                    <span class="logo-text logo-text-desktop" style="font-weight: 800; text-transform: uppercase; font-size: 13px; line-height: 1.1;">
                    APRENDE <span>AUTOMATIZACIÓN</span>
                </span>
                </div>
            </div>

            <!-- MENÚ DE NAVEGACIÓN (SOLO DESKTOP) -->
            <div class="desktop-nav-links" style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center;">
                <a href="index.html" class="nav-item ${currentPage === 'index.html' ? 'active' : ''}" style="padding: 8px 14px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 10px; transition: all 0.3s; white-space: nowrap;">
                    <i class="fas fa-home" style="margin-right: 6px; font-size: 12px; opacity: 0.9;"></i> Home
                </a>
                <a href="catalogo.html" class="nav-item ${currentPage === 'catalogo.html' ? 'active' : ''}" style="padding: 8px 14px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 10px; transition: all 0.3s; white-space: nowrap;">
                    <i class="fas fa-th-large" style="margin-right: 6px; font-size: 12px; opacity: 0.9;"></i> Catálogo
                </a>
                <a href="mis-cursos.html" class="nav-item ${currentPage === 'mis-cursos.html' ? 'active' : ''}" style="padding: 8px 14px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 10px; transition: all 0.3s; white-space: nowrap;">
                    <i class="fas fa-graduation-cap" style="margin-right: 6px; font-size: 12px; opacity: 0.9;"></i> Mis Cursos
                </a>
                <a href="progreso.html" class="nav-item ${currentPage === 'progreso.html' ? 'active' : ''}" style="padding: 8px 14px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 10px; transition: all 0.3s; white-space: nowrap;">
                    <i class="fas fa-chart-line" style="margin-right: 6px; font-size: 12px; opacity: 0.9;"></i> Progreso
                </a>
                <a href="programas.html" class="nav-item ${currentPage === 'programas.html' ? 'active' : ''}" style="padding: 8px 14px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 10px; transition: all 0.3s; white-space: nowrap;">
                    <i class="fas fa-laptop-code" style="margin-right: 6px; font-size: 12px; opacity: 0.9;"></i> Programas
                </a>
            </div>

            <!-- CONTENEDOR DERECHO (SIEMPRE VISIBLE) -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <!-- TOGGLE TEMA -->
                <button onclick="toggleTheme()" class="btn-metal btn-cyan btn-metal-icon" style="padding: 0 !important; width: 38px; height: 38px;" title="Cambiar modo">
                    <i id="theme-icon" class="${savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}"></i>
                </button>

                <!-- BOTÓN USUARIO -->
                <button id="navbarAuthBtn" class="btn-metal btn-cyan" style="border-radius: 50px; font-size: 11px; padding: 8px 18px;" 
                    onclick="if(typeof handleNavbarAuthClick === 'function') { handleNavbarAuthClick(event); }">
                    <i class="fas fa-user" style="color: #2db8ce; font-size: 12px;"></i> 
                    <span id="authBtnText">${isLogged ? (user.name || 'Usuario') : 'Ingresar'}</span>
                </button>
            </div>
        </div>
        <div id="mobile-menu" style="display: none; flex-direction: column; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); padding: 10px 20px; border-top: 1px solid rgba(45, 184, 206, 0.25);">
            <a href="index.html" class="nav-item-mobile ${currentPage === 'index.html' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a>
            <a href="catalogo.html" class="nav-item-mobile ${currentPage === 'catalogo.html' ? 'active' : ''}"><i class="fas fa-th-large"></i> Catálogo</a>
            <a href="mis-cursos.html" class="nav-item-mobile ${currentPage === 'mis-cursos.html' ? 'active' : ''}"><i class="fas fa-graduation-cap"></i> Mis Cursos</a>
            <a href="progreso.html" class="nav-item-mobile ${currentPage === 'progreso.html' ? 'active' : ''}"><i class="fas fa-chart-line"></i> Progreso</a>
            <a href="programas.html" class="nav-item-mobile ${currentPage === 'programas.html' ? 'active' : ''}"><i class="fas fa-laptop-code"></i> Programas</a>
        </div>
    </nav>
    
    <style>
        @media (max-width: 1024px) {
            .desktop-nav-links { display: none !important; }
            #hamburger-btn { display: block !important; }
            .logo-text-desktop { display: none !important; }
        }
        .nav-item-mobile {
            padding: 12px 10px;
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            border-radius: 8px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .nav-item-mobile:hover {
            background: rgba(45, 184, 206, 0.2);
            color: white !important;
        }
        .nav-item-mobile.active {
            background: rgba(45, 184, 206, 0.3);
            color: white !important;
        }
    </style>
    `;
    
    // Lista de páginas que son AULAS VIRTUALES (No deben llevar el menú global)
    const aulasVirtuales = ['arranque-contactores.html', 'arranque-plc-logo.html'];

    // Insertar el navbar al inicio del body si NO es un aula virtual
    if (!aulasVirtuales.includes(currentPage)) {
        document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    }

document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = mobileMenu.style.display === 'flex';
            mobileMenu.style.display = isVisible ? 'none' : 'flex';
        });
    }

    // Initialize theme button title for non-classroom pages
    const themeButton = document.querySelector('nav.global-navbar button[onclick="toggleTheme()"]');
    if (themeButton) {
        const isLight = document.body.classList.contains('light-mode');
        themeButton.title = isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Efecto de entrada suave para todos los elementos con clase .app-card
    const cards = document.querySelectorAll('.course-card, .resource-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });

    console.log("🚀 Interfaz de Usuario optimizada por Gemini.");
});