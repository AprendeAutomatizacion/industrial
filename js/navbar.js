// navbar.js - Sidebar lateral (desktop) + Top Nav de 2 filas (móvil)
// Variante C con responsive móvil

// ============================================================
// FUNCIONES GLOBALES DE COMPRA
// ============================================================
window.buyManual = function(courseId, buyLink) {
    AuthUI.requireAuth(() => {
        if (!AuthLogic.currentUser.accessedCursos) {
            AuthLogic.currentUser.accessedCursos = [];
        }
        if (!AuthLogic.currentUser.accessedCursos.includes(courseId)) {
            AuthLogic.currentUser.accessedCursos.push(courseId);
            localStorage.setItem('user', JSON.stringify(AuthLogic.currentUser));
            AuthLogic.syncUserData();
            if (typeof showNotif === 'function') {
                showNotif('¡Manual Adquirido!', 'El manual ahora aparecerá en tu sección de "Mis Cursos".', 'success');
            }
            if (typeof renderMisCourses === 'function') {
                renderMisCourses();
            }
        }
        window.open(buyLink, '_blank');
    });
};

// Inyectar librería de Confeti
const confettiScript = document.createElement('script');
confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
document.head.appendChild(confettiScript);

// Inyectar fuente Orbitron
const orbitronFont = document.createElement('link');
orbitronFont.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@800&display=swap';
orbitronFont.rel = 'stylesheet';
document.head.appendChild(orbitronFont);

// ============================================================
// FUNCIONES DE GAMIFICACIÓN
// ============================================================
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
    audio.play().catch(() => {});
};

// ============================================================
// DETECCIÓN DE PÁGINA Y ESTADO DEL USUARIO
// ============================================================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

let user = null;
try { user = JSON.parse(localStorage.getItem('user')); } catch(e) { user = null; }
const isLogged = !!user;

// ============================================================
// TEMA CLARO/OSCURO
// ============================================================
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.classList.toggle('light-mode', savedTheme === 'light');

window.toggleTheme = function() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    const icons = document.querySelectorAll('#theme-icon, #theme-icon-mobile, #theme-icon-sidebar');
    icons.forEach(icon => {
        icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    });
};

// ============================================================
// SKELETONS
// ============================================================
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

// ============================================================
// ESTILOS GLOBALES
// ============================================================
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.15); } }

    /* =====================================================
       SIDEBAR LATERAL FIJA (Desktop)
       ===================================================== */
    body {
        padding-left: 68px;
        transition: padding-left 0.3s ease, padding-top 0.3s ease;
    }

    .app-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 68px;
        background: rgba(10, 15, 30, 0.88);
        backdrop-filter: blur(20px) saturate(150%);
        -webkit-backdrop-filter: blur(20px) saturate(150%);
        border-right: 1px solid rgba(45, 184, 206, 0.15);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 0;
        z-index: 1000;
        gap: 6px;
    }

    .app-sidebar .sb-logo {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        background: rgba(45, 184, 206, 0.08);
        border: 1px solid rgba(45, 184, 206, 0.2);
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.25s ease;
    }
    .app-sidebar .sb-logo:hover {
        background: rgba(45, 184, 206, 0.15);
        border-color: rgba(45, 184, 206, 0.4);
        transform: scale(1.05);
    }
    .app-sidebar .sb-logo img {
        width: 28px;
        height: 28px;
        object-fit: contain;
    }

    .sb-divider {
        width: 32px;
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 8px 0;
    }

    .sb-nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex: 1;
    }

    .sb-item {
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        color: rgba(255, 255, 255, 0.55);
        text-decoration: none;
        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        cursor: pointer;
        border: 1px solid transparent;
    }

    .sb-item i {
        font-size: 18px;
        transition: all 0.25s ease;
    }

    .sb-item:hover {
        background: rgba(45, 184, 206, 0.12);
        border-color: rgba(45, 184, 206, 0.3);
        color: #2db8ce;
        transform: translateX(2px);
    }

    .sb-item:hover i {
        transform: scale(1.1);
        filter: drop-shadow(0 0 8px rgba(45, 184, 206, 0.6));
    }

    .sb-item.active {
        background: linear-gradient(135deg, rgba(45, 184, 206, 0.25), rgba(45, 184, 206, 0.08));
        border-color: rgba(45, 184, 206, 0.45);
        color: #fff;
        box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 20px rgba(45, 184, 206, 0.25);
    }

    .sb-item.active::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: #2db8ce;
        border-radius: 0 3px 3px 0;
        box-shadow: 0 0 12px #2db8ce;
    }

    .sb-item.active i {
        filter: drop-shadow(0 0 6px rgba(45, 184, 206, 0.5));
    }

    .sb-tooltip {
        position: absolute;
        left: calc(100% + 14px);
        top: 50%;
        transform: translateY(-50%) translateX(-6px);
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(45, 184, 206, 0.35);
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 9px 14px;
        border-radius: 10px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(45, 184, 206, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        transition: all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 1001;
    }

    .sb-tooltip::before {
        content: '';
        position: absolute;
        left: -5px;
        top: 50%;
        transform: translateY(-50%) rotate(45deg);
        width: 8px;
        height: 8px;
        background: rgba(15, 23, 42, 0.98);
        border-left: 1px solid rgba(45, 184, 206, 0.35);
        border-bottom: 1px solid rgba(45, 184, 206, 0.35);
    }

    .sb-item:hover .sb-tooltip,
    .sb-action:hover .sb-tooltip {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
    }

    .sb-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        width: 44px;
    }

    .sb-action {
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.25s ease;
        border: 1px solid transparent;
        background: none;
    }

    .sb-action i { font-size: 16px; }

    .sb-action:hover {
        background: rgba(45, 184, 206, 0.12);
        border-color: rgba(45, 184, 206, 0.3);
        color: #2db8ce;
    }

    .sb-action.user {
        background: linear-gradient(135deg, rgba(45, 184, 206, 0.9), rgba(6, 182, 212, 0.9));
        color: #fff;
        box-shadow: 0 4px 14px rgba(45, 184, 206, 0.35);
    }

    .sb-action.user:hover {
        box-shadow: 0 6px 20px rgba(45, 184, 206, 0.5);
        transform: translateY(-2px);
    }

    /* Modo claro sidebar */
    body.light-mode .app-sidebar {
        background: rgba(255, 255, 255, 0.88);
        border-right-color: rgba(8, 145, 178, 0.2);
    }
    body.light-mode .sb-item {
        color: rgba(15, 23, 42, 0.55);
    }
    body.light-mode .sb-item:hover {
        background: rgba(8, 145, 178, 0.1);
        border-color: rgba(8, 145, 178, 0.3);
        color: #0891b2;
    }
    body.light-mode .sb-item.active {
        background: linear-gradient(135deg, rgba(8, 145, 178, 0.2), rgba(8, 145, 178, 0.06));
        border-color: rgba(8, 145, 178, 0.4);
        color: #0f172a;
    }
    body.light-mode .sb-item.active::before {
        background: #0891b2;
        box-shadow: 0 0 12px #0891b2;
    }
    body.light-mode .sb-tooltip {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
        border-color: rgba(8, 145, 178, 0.3);
        color: #0f172a;
        box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.15),
            0 0 20px rgba(8, 145, 178, 0.15);
    }
    body.light-mode .sb-tooltip::before {
        background: rgba(255, 255, 255, 0.98);
        border-left-color: rgba(8, 145, 178, 0.3);
        border-bottom-color: rgba(8, 145, 178, 0.3);
    }
    body.light-mode .sb-action {
        color: rgba(15, 23, 42, 0.6);
    }
    body.light-mode .sb-action:hover {
        background: rgba(8, 145, 178, 0.1);
        border-color: rgba(8, 145, 178, 0.3);
        color: #0891b2;
    }
    body.light-mode .sb-divider {
        background: rgba(0, 0, 0, 0.08);
    }
    body.light-mode .sb-actions {
        border-top-color: rgba(0, 0, 0, 0.06);
    }

    /* =====================================================
       TOP NAV DE 2 FILAS (Móvil) — oculto por defecto en desktop
       ===================================================== */
    .app-top-nav {
        display: none;
    }

    @media (max-width: 768px) {
        body {
            padding-left: 0;
            padding-top: 112px; /* espacio para las 2 filas */
        }
        .app-sidebar {
            display: none !important;
        }

        .app-top-nav {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(10, 15, 30, 0.96);
            backdrop-filter: blur(20px) saturate(150%);
            -webkit-backdrop-filter: blur(20px) saturate(150%);
            border-bottom: 1px solid rgba(45, 184, 206, 0.2);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            z-index: 1000;
        }

        /* ========= FILA 1: LOGO + ACCIONES ========= */
        .tn-row-1 {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            height: 56px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            gap: 12px;
        }

        .tn-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            flex-shrink: 1;
            min-width: 0;
            overflow: hidden;
        }

        .tn-logo img {
            height: 30px;
            width: 30px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .tn-logo-text {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #fff;
        }

        .tn-logo-text span {
            color: #02d6fe;
        }

        .tn-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .tn-action-btn {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 11px;
            color: #2db8ce;
            background: rgba(45, 184, 206, 0.08);
            border: 1px solid rgba(45, 184, 206, 0.2);
            cursor: pointer;
            transition: all 0.25s ease;
            font-size: 15px;
            position: relative;
        }

        .tn-action-btn:hover,
        .tn-action-btn:active {
            background: rgba(45, 184, 206, 0.2);
            border-color: rgba(45, 184, 206, 0.4);
            transform: scale(1.05);
        }

        .tn-action-btn.user {
            background: linear-gradient(135deg, rgba(45, 184, 206, 0.9), rgba(6, 182, 212, 0.9));
            color: #fff;
            border-color: rgba(45, 184, 206, 0.5);
            box-shadow: 0 4px 14px rgba(45, 184, 206, 0.35);
            width: auto;
            padding: 0 12px;
            gap: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .tn-action-btn.user span {
            white-space: nowrap;
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* ========= FILA 2: NAVEGACIÓN ========= */
        .tn-row-2 {
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: 4px 2px 6px;
            height: 56px;
            gap: 2px;
        }

        .tn-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            padding: 6px 2px;
            border-radius: 12px;
            transition: all 0.25s ease;
            position: relative;
            cursor: pointer;
            border: none;
            background: none;
            min-width: 0;
        }

        .tn-item i {
            font-size: 16px;
            transition: all 0.25s ease;
        }

        .tn-item span {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            transition: all 0.25s ease;
        }

        .tn-item.active {
            color: #2db8ce;
        }

        .tn-item.active i {
            filter: drop-shadow(0 0 10px rgba(45, 184, 206, 0.8));
            transform: scale(1.15);
        }

        .tn-item.active span {
            color: #2db8ce;
        }

        .tn-item.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 22px;
            height: 3px;
            background: #2db8ce;
            border-radius: 3px 3px 0 0;
            box-shadow: 0 0 12px #2db8ce, 0 -2px 6px rgba(45, 184, 206, 0.5);
        }

        .tn-item:active {
            background: rgba(45, 184, 206, 0.1);
        }

        /* ========= MODO CLARO ========= */
        body.light-mode .app-top-nav {
            background: rgba(255, 255, 255, 0.96);
            border-bottom-color: rgba(8, 145, 178, 0.2);
        }
        body.light-mode .tn-row-1 {
            border-bottom-color: rgba(0, 0, 0, 0.06);
        }
        body.light-mode .tn-logo-text {
            color: #0f172a;
        }
        body.light-mode .tn-logo-text span {
            color: #0891b2;
        }
        body.light-mode .tn-action-btn {
            color: #0891b2;
            background: rgba(8, 145, 178, 0.08);
            border-color: rgba(8, 145, 178, 0.2);
        }
        body.light-mode .tn-action-btn:hover,
        body.light-mode .tn-action-btn:active {
            background: rgba(8, 145, 178, 0.2);
            border-color: rgba(8, 145, 178, 0.4);
        }
        body.light-mode .tn-action-btn.user {
            background: linear-gradient(135deg, rgba(8, 145, 178, 0.9), rgba(6, 182, 212, 0.9));
            color: #fff;
        }
        body.light-mode .tn-item {
            color: rgba(15, 23, 42, 0.55);
        }
        body.light-mode .tn-item.active {
            color: #0891b2;
        }
        body.light-mode .tn-item.active span {
            color: #0891b2;
        }
        body.light-mode .tn-item.active i {
            filter: drop-shadow(0 0 10px rgba(8, 145, 178, 0.6));
        }
        body.light-mode .tn-item.active::after {
            background: #0891b2;
            box-shadow: 0 0 12px #0891b2, 0 -2px 6px rgba(8, 145, 178, 0.4);
        }
        body.light-mode .tn-item:active {
            background: rgba(8, 145, 178, 0.1);
        }
    }

    /* =====================================================
       RESTO DE ESTILOS ORIGINALES
       ===================================================== */
    .font-display {
        font-family: 'Orbitron', sans-serif !important;
        letter-spacing: -0.03em !important;
        text-shadow: 0 2px 15px rgba(45, 184, 206, 0.2);
    }
    body.light-mode .font-display {
        text-shadow: none !important;
    }

    .progress-current-title {
        color: #ffffff !important;
    }
    
    body:not(.light-mode) { 
        background-color: #0f172a !important;
        color: #ffffff !important;
    }

    body:not(.light-mode) .bg-slate-900, 
    body:not(.light-mode) .bg-gray-900,
    body:not(.light-mode) footer,
    body:not(.light-mode) .bg-\\[\\#0f172a\\] { 
        background-color: #0b1320 !important; 
        color: #ffffff !important;
    }

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
        border-color: #4a5568 !important;
        color: #ffffff !important;
    }

    body:not(.light-mode) h1, body:not(.light-mode) h2, 
    body:not(.light-mode) h3, body:not(.light-mode) h4,
    body:not(.light-mode) .text-slate-900 {
        color: #ffffff !important;
    }

    body:not(.light-mode) #adminModal .bg-slate-50,
    body:not(.light-mode) #adminModal .bg-white {
        background-color: #f8fafc !important;
        color: #334155 !important;
    }
    body:not(.light-mode) #adminModal * {
        color: #334155 !important;
    }
    body:not(.light-mode) #adminModal .text-white { color: #ffffff !important; }

    body.light-mode {
        background-color: #d0e1ef !important;
        color: #0f172a !important;
    }

    body.light-mode .header-gradient-overlay {
        background: transparent !important;
    }

    .page-section, .section-themed {
        background-color: transparent !important;
        border: none !important;
        color: #ffffff;
    }
    .page-section .section-subtitle { color: #2db8ce; }
    .page-section p, .page-section .text-blue-50 { color: #cbd5e1; }
    .page-section .absolute.inset-0.z-0 { display: none; }

    body.light-mode .page-section,
    body.light-mode .section-themed {
        color: #0f172a !important;
    }
    body.light-mode .page-section .section-subtitle { color: #0f172a !important; }
    body.light-mode .page-section p, body.light-mode .page-section .text-blue-50 { color: #1e293b !important; }
    body.light-mode .page-section img {
        mix-blend-mode: luminosity !important;
        opacity: 0.1 !important;
    }
    body.light-mode #countryRankListGlobal img {
        mix-blend-mode: normal !important;
        opacity: 1 !important;
    }
    body.light-mode #instructor img {
        mix-blend-mode: normal !important;
        opacity: 1 !important;
    }
    body.light-mode .page-section .course-card-image {
        mix-blend-mode: normal !important;
        opacity: 1 !important;
    }
    body.light-mode #instructor {
        background-color: transparent !important;
        border-color: transparent !important;
    }
    body.light-mode #instructor .text-slate-300,
    body.light-mode #instructor .text-slate-400,
    body.light-mode #instructor .text-slate-500 {
        color: #475569 !important;
    }
    body.light-mode #mision .mission-card img {
        mix-blend-mode: normal !important;
        opacity: 1 !important;
    }
    body.light-mode #curso-especial .special-course-image {
        mix-blend-mode: normal !important;
        opacity: 1 !important;
    }
    body.light-mode #courses-grid .course-card img {
        opacity: 1 !important;
        mix-blend-mode: normal !important;
    }
    body.light-mode #programsGrid img {
        opacity: 1 !important;
        mix-blend-mode: normal !important;
    }

    body.light-mode #curso-especial .special-course-card {
        background-color: #ffffff !important;
    }
    body.light-mode #curso-especial .text-white {
        color: #1e293b !important;
    }
    body.light-mode #curso-especial .section-subtitle {
        color: #0f172a !important;
    }
    body.light-mode #curso-especial .text-\\[\\#02d6fe\\],
    body.light-mode #curso-especial .text-\\[\\#2db8ce\\] {
        color: #0891b2 !important;
    }
    body.light-mode #curso-especial .bg-white\\/5 {
        background-color: #f8fafc !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #curso-especial .text-slate-500 {
        color: #64748b !important;
    }
    body.light-mode #curso-especial .border-white\\/10 {
        border-color: #e2e8f0 !important;
    }

    body.light-mode #metodologia .methodology-card {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #metodologia .methodology-card h3 {
        color: #1e293b !important;
    }
    body.light-mode #metodologia .methodology-card p {
        color: #475569 !important;
    }
    body.light-mode #metodologia .methodology-card img {
        mix-blend-mode: normal !important;
        opacity: 1 !important;
    }

    body.light-mode #comunidad .prof-btn {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #comunidad .prof-btn span {
        color: #1e293b !important;
    }
    body.light-mode #comunidad .prof-btn .prof-count-bg {
        background-color: #f1f5f9 !important;
    }
    body.light-mode #comunidad .prof-btn .prof-count-bg span {
        color: #334155 !important;
    }
    body.light-mode #comunidad .prof-selected {
        background: #cffafe !important;
        border: 2px solid #0891b2 !important;
        box-shadow: 0 0 20px rgba(8, 145, 178, 0.25) !important;
    }
    body.light-mode #comunidad .prof-selected > span {
        color: #155e75 !important;
    }
    body.light-mode #comunidad .prof-selected i {
        color: #0891b2 !important;
    }
    body.light-mode #comunidad .prof-selected .prof-count-bg {
        background-color: #ffffff !important;
        border: 1px solid #a5f3fc !important;
    }
    body.light-mode #comunidad .prof-selected .prof-count-bg span {
        color: #0891b2 !important;
    }

    body.light-mode #testimonios .testimonial-card {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #testimonios .testimonial-card p,
    body.light-mode #testimonios .testimonial-card h4,
    body.light-mode #testimonios .testimonial-card .testimonial-role {
        color: #475569 !important;
    }
    body.light-mode #testimonios .testimonial-card .fa-quote-right {
        color: #94a3b8 !important;
        opacity: 0.1 !important;
    }
    body.light-mode #testimonios .testimonial-card .w-12.h-12 {
        background-color: #e0f2fe !important;
        color: #0c4a6e !important;
    }

    body.light-mode #modalidades .course-card ul {
        color: #475569 !important;
    }
    body.light-mode #modalidades .course-card .text-purple-400 {
        color: #9333ea !important;
    }
    body.light-mode #modalidades .course-card .text-cyan-400 {
        color: #0891b2 !important;
    }

    body.light-mode #comunidad-global .bg-gray-900 {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #comunidad-global .bg-white\\/5 {
        background-color: #f8fafc !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #comunidad-global .text-white {
        color: #1e293b !important;
    }
    body.light-mode #comunidad-global .text-cyan-500 {
        color: #0891b2 !important;
    }
    body.light-mode #visitorMapGlobal svg text { fill: #334155 !important; }

    body.light-mode #metrics {
        background-color: #f8fafc !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #metrics .font-black,
    body.light-mode #metrics .text-slate-400 {
        color: #0f172a !important;
    }
    body.light-mode #metrics .text-\\[\\#2db8ce\\] { color: #0891b2 !important; }
    body.light-mode #metrics .text-teal-400 { color: #0d9488 !important; }
    body.light-mode #metrics .text-cyan-400 { color: #0891b2 !important; }
    body.light-mode #metrics .text-red-400 { color: #dc2626 !important; }
    body.light-mode #metrics .text-blue-400 { color: #2563eb !important; }

    body.light-mode #faq {
        background-color: #b2c0cc !important;
    }
    body.light-mode #faq .bg-white\\/5 {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #faq .text-white {
        color: #0f172a !important;
    }
    body.light-mode #faq .text-slate-400 {
        color: #475569 !important;
    }
    body.light-mode #faq .border-white\\/10 { border-color: #e2e8f0 !important; }
    body.light-mode #faq .group:hover { border-color: #bfdbfe !important; }

    body.light-mode .bg-white\\/10,
    body.light-mode .bg-\\[\\#0f172a\\]\\/60 {
        background-color: #b2c0cc !important;
        border-color: #c8d2dc !important;
    }
    body.light-mode .bg-white\\/10 > .absolute.inset-0.z-0 img {
        mix-blend-mode: soft-light !important;
        opacity: 0.4 !important;
    }
    body.light-mode .bg-white\\/10 .text-white,
    body.light-mode .bg-white\\/10 .text-blue-50 {
        color: #1e293b !important;
    }
    body.light-mode .bg-white\\/10 .text-slate-300,
    body.light-mode .bg-white\\/10 .text-slate-400 {
        color: #64748b !important;
    }
    body.light-mode header .text-secondary {
        color: #0891b2 !important;
    }

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

    body.light-mode #visitor-info {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode #visitor-info,
    body.light-mode #visitor-info span,
    body.light-mode #visitor-info .text-white\\/30 {
        color: #334155 !important;
    }
    body.light-mode #visitor-info .fa-eye {
        color: #22c55e !important;
    }

    body.light-mode #misCursosUserInfo > div {
        background-color: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
    }
    body.light-mode #misCursosUserInfo .text-white,
    body.light-mode #misCursosUserInfo .text-slate-400 {
        color: #0f172a !important;
    }
    body.light-mode #misCursosUserInfo .text-\\[\\#2db8ce\\] { color: #0891b2 !important; }
    body.light-mode #misCursosUserInfo .bg-white\\/5 { background-color: rgba(255, 255, 255, 0.6) !important; border-color: rgba(255, 255, 255, 0.9) !important; }
    body.light-mode #misCursosUserInfo .border-white\\/10 { border-color: #c8d2dc !important; }
    body.light-mode #misCursosUserInfo .text-teal-400 { color: #0d9488 !important; }
    body.light-mode #misCursosUserInfo .text-purple-400 { color: #7e22ce !important; }
    body.light-mode #misCursosUserInfo .text-amber-400 { color: #b45309 !important; }
    body.light-mode #misCursosUserInfo .text-red-400 { color: #b91c1c !important; }

    body.light-mode .bg-blue-900\\/30,
    body.light-mode .bg-red-900\\/30,
    body.light-mode .bg-slate-700\\/30 {
        background-color: #ffffff !important;
    }
    body.light-mode .bg-blue-900\\/30, body.light-mode .bg-blue-900\\/30 *,
    body.light-mode .bg-red-900\\/30, body.light-mode .bg-red-900\\/30 * {
        color: #1e293b !important;
    }
    body.light-mode .bg-slate-700\\/30, body.light-mode .bg-slate-700\\/30 * {
        color: #475569 !important;
    }
    body.light-mode .border-blue-500\\/50 { border-color: #bfdbfe !important; }
    body.light-mode .border-red-500\\/50 { border-color: #fca5a5 !important; }
    body.light-mode .border-slate-500\\/50 { border-color: #cbd5e1 !important; }

    body.light-mode .bg-\\[\\#0f172a\\]\\/60 .text-slate-400 {
        color: #475569 !important;
    }
    body.light-mode #achievements-container .bg-blue-500\\/20 {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
        backdrop-filter: none !important;
    }
    body.light-mode #achievements-container .text-white {
        color: #475569 !important;
    }
    body.light-mode #achievements-container .text-green-400 {
        color: #16a34a !important;
    }

    body.light-mode .glass-light,
    body.light-mode #page-curso-detalle .bg-slate-50 {
        background-color: #ffffff !important;
    }

    body.light-mode .course-card,
    body.light-mode #programsGrid > div {
        background-color: #ffffff !important;
        border-color: #e2e8f0 !important;
    }
    body.light-mode .course-card h2, body.light-mode .course-card h3,
    body.light-mode #programsGrid h2,
    body.light-mode #programsGrid .text-white {
        color: #1e293b !important;
    }
    body.light-mode .course-card p, body.light-mode #programsGrid p,
    body.light-mode #programsGrid .text-slate-300 {
        color: #475569 !important;
    }

    .special-blend-image {
        opacity: 0.5;
        mix-blend-mode: luminosity;
    }
    body.light-mode .special-blend-image {
        opacity: 1 !important;
        mix-blend-mode: normal !important;
    }

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

    .logo-text { color: #ffffff !important; } 
    body.light-mode .logo-text { color: #0f172a !important; }
    .logo-text span, .logo-text span span, .logo-text span i { color: #02d6fe !important; }
    
    body.light-mode .force-white-text {
        color: #ffffff !important;
    }

    #mision h2 span,
    #instructor h2 span,
    #cursos-destacados h2 span,
    #manuales h2 span,
    #modalidades h2 span,
    #curso-especial h2 span,
    #metodologia h2 span,
    #comunidad h2 span,
    #testimonios h2 span,
    #comunidad-global h2 span,
    #faq h2 span,
    #contacto h2 span,
    .featured-title, 
    .testimonials-title {
        color: #2db8ce !important;
    }

    body.light-mode #mision h2 span,
    body.light-mode #instructor h2 span,
    body.light-mode #cursos-destacados h2 span,
    body.light-mode #manuales h2 span,
    body.light-mode #modalidades h2 span,
    body.light-mode #curso-especial h2 span,
    body.light-mode #metodologia h2 span,
    body.light-mode #comunidad h2 span,
    body.light-mode #testimonios h2 span,
    body.light-mode #comunidad-global h2 span,
    body.light-mode #faq h2 span,
    body.light-mode #contacto h2 span,
    body.light-mode .featured-title, 
    body.light-mode .testimonials-title {
        color: #0891b2 !important;
    }

    @media (max-width: 767px) {
        main h2.text-xl,
        main h3.text-xl {
            font-size: 1.125rem;
            line-height: 1.75rem;
        }
    }

    /* Botones unificados */
    .btn-metal {
        transition: transform 0.18s ease-out, box-shadow 0.18s ease-out, filter 0.18s ease-out !important;
        text-transform: uppercase !important;
        font-weight: 800 !important;
        letter-spacing: 0.06em !important;
        border-radius: 12px !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 11px 22px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }
    .btn-metal::before {
        content: '';
        position: absolute;
        top: 0; left: -75%;
        width: 55%; height: 100%;
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%);
        transform: skewX(-18deg);
        transition: left 0.45s ease;
        pointer-events: none;
    }
    .btn-metal:hover::before { left: 125%; }
    .btn-metal:hover { transform: translateY(-2px) !important; filter: brightness(1.06); }
    .btn-metal:active { transform: scale(0.97) translateY(0) !important; filter: brightness(0.94); }

    body.light-mode .btn-metal {
        background: linear-gradient(180deg, #f5f9fc 0%, #dde5ee 55%, #c8d3df 100%) !important;
        border: 1px solid #b0bbc8 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.14) !important;
        text-shadow: 0 1px 0 rgba(255,255,255,0.6);
    }
    body.light-mode .btn-metal:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 5px 14px rgba(0,0,0,0.18) !important; }

    body:not(.light-mode) .btn-metal {
        background: linear-gradient(180deg, #5a6678 0%, #3a4252 55%, #252d3a 100%) !important;
        border: 1px solid #1a202c !important;
        box-shadow: inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.5) !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    }
    body:not(.light-mode) .btn-metal:hover { background: linear-gradient(180deg, #68778a 0%, #47536a 55%, #303a4a 100%) !important; box-shadow: inset 0 1px 1px rgba(255,255,255,0.18), 0 5px 16px rgba(0,0,0,0.55) !important; }

    body.light-mode .btn-cyan { color: #0891b2 !important; }
    body.light-mode .btn-cyan i { text-shadow: 0 0 8px rgba(8, 145, 178, 0.7); }
    body:not(.light-mode) .btn-cyan { color: #2db8ce !important; }
    body:not(.light-mode) .btn-cyan i { text-shadow: 0 0 10px rgba(45, 184, 206, 0.8); }

    .btn-metal-icon { padding: 0 !important; width: 40px; height: 40px; border-radius: 9999px !important; }

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

    .btn-metal-solid {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 28px;
        font-weight: 900;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        border-radius: 16px;
        cursor: pointer;
        text-decoration: none;
        position: relative;
        overflow: hidden;
        transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        border: none;
        width: 100%;
    }
    .btn-metal-cyan {
        background: linear-gradient(180deg, #38c9e0 0%, #18a0b5 40%, #0f7a8a 100%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25), 0 4px 14px rgba(45, 184, 206, 0.45);
        color: #ffffff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.35);
        border: 1px solid #0a6070;
    }
    .btn-metal-green {
        background: linear-gradient(180deg, #34d058 0%, #1e9e3a 40%, #146b28 100%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 14px rgba(34, 197, 94, 0.45);
        color: #ffffff;
        border: 1px solid #0f5720;
    }
    .btn-metal-outline-cyan {
        background: linear-gradient(180deg, rgba(45,184,206,0.08) 0%, rgba(45,184,206,0.02) 100%);
        box-shadow: inset 0 1px 0 rgba(45,184,206,0.3), 0 2px 8px rgba(45, 184, 206, 0.15);
        color: #2db8ce;
        border: 2px solid #2db8ce;
    }
    .btn-enrolled-badge {
        display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 14px 24px; border-radius: 16px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; color: #15803d; box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(34, 197, 94, 0.2); cursor: default;
    }
`;
document.head.appendChild(style);

// ============================================================
// INDICADOR DE SYNC
// ============================================================
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

// ============================================================
// SIDEBAR HTML (Desktop)
// ============================================================
const sidebarHTML = `
<aside class="app-sidebar">
    
    <div class="sb-logo" onclick="window.location.href='index.html'" title="Ir al inicio">
        <img src="img/AA (38).webp" alt="Logo" onerror="this.src='https://i.postimg.cc/c4zrcgBD/Logo-2025-2.png'">
    </div>

    <div class="sb-divider"></div>

    <nav class="sb-nav">
        <a href="index.html" class="sb-item ${currentPage === 'index.html' ? 'active' : ''}">
            <i class="fas fa-home"></i>
            <span class="sb-tooltip">Home</span>
        </a>
        <a href="catalogo.html" class="sb-item ${currentPage === 'catalogo.html' ? 'active' : ''}">
            <i class="fas fa-th-large"></i>
            <span class="sb-tooltip">Catálogo</span>
        </a>
        <a href="mis-cursos.html" class="sb-item ${currentPage === 'mis-cursos.html' ? 'active' : ''}">
            <i class="fas fa-graduation-cap"></i>
            <span class="sb-tooltip">Mis Cursos</span>
        </a>
        <a href="progreso.html" class="sb-item ${currentPage === 'progreso.html' ? 'active' : ''}">
            <i class="fas fa-chart-line"></i>
            <span class="sb-tooltip">Progreso</span>
        </a>
        <a href="programas.html" class="sb-item ${currentPage === 'programas.html' ? 'active' : ''}">
            <i class="fas fa-laptop-code"></i>
            <span class="sb-tooltip">Programas</span>
        </a>
    </nav>

    <div class="sb-actions">
        <button onclick="toggleTheme()" class="sb-action" title="">
            <i id="theme-icon" class="${savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}"></i>
            <span class="sb-tooltip">${savedTheme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
        </button>
        <button id="navbarAuthBtn" class="sb-action user" title="" onclick="if(typeof handleNavbarAuthClick === 'function') { handleNavbarAuthClick(event); }">
            <i class="fas fa-user"></i>
            <span class="sb-tooltip" id="authBtnText">${isLogged ? (user.name || 'Usuario') : 'Ingresar'}</span>
        </button>
    </div>

</aside>
`;

// ============================================================
// TOP NAV HTML (Móvil - 2 filas)
// ============================================================
const topNavHTML = `
<nav class="app-top-nav">

    <!-- FILA 1: LOGO + ACCIONES -->
    <div class="tn-row-1">
        <div class="tn-logo" onclick="window.location.href='index.html'">
            <img src="img/AA (38).webp" alt="Logo" onerror="this.src='https://i.postimg.cc/c4zrcgBD/Logo-2025-2.png'">
            <span class="tn-logo-text">APRENDE <span>AUTOMATIZACIÓN</span></span>
        </div>
        <div class="tn-actions">
            <button class="tn-action-btn" onclick="toggleTheme()" title="Cambiar tema">
                <i id="theme-icon-mobile" class="${savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}"></i>
            </button>
            <button class="tn-action-btn user" onclick="if(typeof handleNavbarAuthClick === 'function') { handleNavbarAuthClick(event); }">
                <i class="fas fa-user"></i>
                <span>${isLogged ? (user.name || 'Usuario') : 'Ingresar'}</span>
            </button>
        </div>
    </div>

    <!-- FILA 2: NAVEGACIÓN -->
    <div class="tn-row-2">
        <a href="index.html" class="tn-item ${currentPage === 'index.html' ? 'active' : ''}">
            <i class="fas fa-home"></i>
            <span>Home</span>
        </a>
        <a href="catalogo.html" class="tn-item ${currentPage === 'catalogo.html' ? 'active' : ''}">
            <i class="fas fa-th-large"></i>
            <span>Catálogo</span>
        </a>
        <a href="mis-cursos.html" class="tn-item ${currentPage === 'mis-cursos.html' ? 'active' : ''}">
            <i class="fas fa-graduation-cap"></i>
            <span>Mis Cursos</span>
        </a>
        <a href="progreso.html" class="tn-item ${currentPage === 'progreso.html' ? 'active' : ''}">
            <i class="fas fa-chart-line"></i>
            <span>Progreso</span>
        </a>
        <a href="programas.html" class="tn-item ${currentPage === 'programas.html' ? 'active' : ''}">
            <i class="fas fa-laptop-code"></i>
            <span>Programas</span>
        </a>
    </div>

</nav>
`;

// ============================================================
// INSERTAR SIDEBAR + TOP NAV
// ============================================================
const aulasVirtuales = ['arranque-contactores.html', 'arranque-plc-logo.html'];

if (!aulasVirtuales.includes(currentPage)) {
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    document.body.insertAdjacentHTML('afterbegin', topNavHTML);
}

// ============================================================
// EFECTOS DE ENTRADA PARA TARJETAS
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
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

    console.log("🚀 Navegación responsive: Sidebar (desktop) + Top Nav 2 filas (móvil).");
});