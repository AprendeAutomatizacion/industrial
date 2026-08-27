// ==========================================
// SCRIPT DE APRENDE AUTOMATIZACIÓN - PÁGINA DE INICIO
// (ACTUALIZADO - MISIÓN Y COMUNIDAD EDITABLES DESDE EXCEL - USANDO BADGE)
// ==========================================

const API_URL = 'https://script.google.com/macros/s/AKfycbykJxx0nLzxv3nPygbvlVz4y6gqTWQyZDCKw-xxxgPHXzVUyd4n5I7G3p87jxWPj3jx/exec';

const countryToISO = { "venezuela": "ve", "colombia": "co", "méxico": "mx", "mexico": "mx", "españa": "es", "spain": "es", "argentina": "ar", "perú": "pe", "peru": "pe", "chile": "cl", "ecuador": "ec", "bolivia": "bo", "paraguay": "py", "uruguay": "uy", "costa rica": "cr", "panamá": "pa", "panama": "pa", "república dominicana": "do", "guatemala": "gt", "honduras": "hn", "el salvador": "sv", "nicaragua": "ni", "cuba": "cu", "puerto rico": "pr", "estados unidos": "us", "francia": "fr", "brasil": "br", "italia": "it", "alemania": "de", "canadá": "ca", "reino unido": "gb", "portugal": "pt", "haití": "ht", "japon": "jp", "china": "cn", "rusia": "ru", "bélgica": "be", "suiza": "ch", "jamaica": "jm" };

const countryAliases = { "ve": "Venezuela", "venezuela": "Venezuela", "co": "Colombia", "colombia": "Colombia", "mx": "México", "mexico": "México", "es": "España", "spain": "España", "ar": "Argentina", "argentina": "Argentina", "pe": "Perú", "peru": "Perú", "cl": "Chile", "chile": "Chile", "ec": "Ecuador", "ecuador": "Ecuador", "bo": "Bolivia", "bolivia": "Bolivia", "py": "Paraguay", "paraguay": "Paraguay", "uy": "Uruguay", "uruguay": "Uruguay", "cr": "Costa Rica", "costa rica": "Costa Rica", "pa": "Panamá", "panama": "Panamá", "do": "República Dominicana", "gt": "Guatemala", "hn": "Honduras", "sv": "El Salvador", "ni": "Nicaragua", "cu": "Cuba", "pr": "Puerto Rico", "us": "Estados Unidos", "fr": "Francia", "br": "Brasil", "it": "Italia", "de": "Alemania", "ca": "Canadá", "gb": "Reino Unido", "pt": "Portugal", "ht": "Haití", "jp": "Japón", "cn": "China", "ru": "Rusia", "be": "Bélgica", "ch": "Suiza", "jm": "Jamaica" };

let dbUsers = {};
let globalStats = {};
let currentUser = null;
let homePageData = {
    hero: [], instructor: [], cursos_destacados: [], manuales: [],
    modalidades: [], curso_especial: [], metodologia: [],
    testimonios: [], faq: [], cta: [], mision: [], comunidad: []
};

let googleChartsLoaded = false;
let googleChartsLoading = false;

// ==========================================
// CARGAR USUARIO
// ==========================================
function loadCurrentUser() {
    try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            console.log('👤 Usuario cargado:', currentUser.name);
            return currentUser;
        }
        return null;
    } catch (e) { return null; }
}

// ==========================================
// PING
// ==========================================
function ping(action, key) {
    try {
        if (navigator.sendBeacon) {
            navigator.sendBeacon(API_URL, new URLSearchParams({action, key}));
        } else {
            fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `action=${encodeURIComponent(action)}&key=${encodeURIComponent(key)}` });
        }
    } catch (e) {}
}

// ==========================================
// SYNCRONIZAR USUARIO
// ==========================================
async function syncUserData() {
    if (!currentUser || !currentUser.email) return;
    const email = currentUser.email.toLowerCase();
    const userData = JSON.stringify(currentUser);
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=update_user&email=${encodeURIComponent(email)}&userData=${encodeURIComponent(userData)}`
        });
    } catch (e) {}
}

// ==========================================
// REGISTRAR PROFESIÓN (ACTUALIZADO PARA PERFILES DINÁMICOS)
// ==========================================
function regCom(profile) {
    const previousProfile = localStorage.getItem('user_profile_selected');
    if (previousProfile === profile) {
        showNotif('Voto ya registrado', 'Tu selección ya fue contada.', 'info');
        return;
    }
    if (previousProfile) {
        ping('decrement_stat', `perfil_${previousProfile}`);
        if (globalStats) {
            globalStats[`perfil_${previousProfile}`] = Math.max(0, (parseInt(globalStats[`perfil_${previousProfile}`]) || 1) - 1);
            const oldEl = document.getElementById(`cnt-${previousProfile}`);
            if (oldEl) oldEl.innerText = globalStats[`perfil_${previousProfile}`];
        }
    }
    document.querySelectorAll('.prof-btn').forEach(b => b.classList.remove('prof-selected'));
    const selectedBtn = document.getElementById(`btn-${profile}`);
    if (selectedBtn) selectedBtn.classList.add('prof-selected');
    
    ping('update_stat', `perfil_${profile}`);
    if (globalStats) {
        globalStats[`perfil_${profile}`] = (parseInt(globalStats[`perfil_${profile}`]) || 0) + 1;
        const countEl = document.getElementById(`cnt-${profile}`);
        if (countEl) countEl.innerText = globalStats[`perfil_${profile}`];
    }
    localStorage.setItem('user_profile_selected', profile);
    
    if (currentUser) {
        currentUser.profession = profile;
        localStorage.setItem('user', JSON.stringify(currentUser));
        syncUserData();
    } else {
        const freshUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (freshUser && freshUser.email) {
            freshUser.profession = profile;
            currentUser = freshUser;
            localStorage.setItem('user', JSON.stringify(freshUser));
            syncUserData();
        }
    }
    showNotif('¡Gracias por participar!', 'Tu perfil ha sido registrado.', 'success');
}

// ==========================================
// TOGGLE LIKE
// ==========================================
function toggleLike(btn) {
    const id = btn.dataset.id;
    if (!currentUser) currentUser = JSON.parse(localStorage.getItem('user') || 'null') || { likedCourses: [], name: '', email: '' };
    if (!currentUser.likedCourses) currentUser.likedCourses = [];
    const span = btn.querySelector('.like-count');
    let currentLikes = parseInt(span.innerText) || 0;
    
    if (currentUser.likedCourses.includes(id)) {
        currentUser.likedCourses = currentUser.likedCourses.filter(c => c !== id);
        ping('decrement_stat', `${id}_likes`);
        btn.classList.remove('liked');
        span.innerText = Math.max(0, currentLikes - 1);
    } else {
        currentUser.likedCourses.push(id);
        ping('update_stat', `${id}_likes`);
        btn.classList.add('liked');
        span.innerText = currentLikes + 1;
    }
    localStorage.setItem('user', JSON.stringify(currentUser));
    syncUserData();
}

// ==========================================
// REGISTRAR VISTA
// ==========================================
function registerViewAndGo(url, courseId, target = '_blank') {
    ping('update_stat', `curso-${courseId}_vistas`);
    if (url && url !== '#') window.open(url, target);
}

// ==========================================
// INICIAR SCROLL REVEAL
// ==========================================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.15 });
    reveals.forEach(el => observer.observe(el));
}

// ==========================================
// INICIAR INFO DEL VISITANTE
// ==========================================
async function initVisitorInfo() {
    const visitorInfo = document.getElementById('visitor-info');
    const countryEl = document.getElementById('visitor-country');
    const flagEl = document.getElementById('visitor-flag');
    
    if (visitorInfo) visitorInfo.classList.remove('opacity-0');
    
    const services = ['https://ipapi.co/json/', 'https://ipwho.is/'];
    for (const service of services) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const response = await fetch(service, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) continue;
            const data = await response.json();
            let countryName = data.country_name || data.country || '';
            let countryCode = data.country_code || '';
            
            if (countryName && countryName !== 'Unknown') {
                if (countryEl) countryEl.innerText = countryName;
                if (flagEl && countryCode) {
                    flagEl.src = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
                    flagEl.classList.remove('hidden');
                }
                ping('update_stat', 'visitas_totales');
                ping('update_stat', 'visita_pais_' + countryName);
                return;
            }
        } catch (e) {}
    }
    if (countryEl) countryEl.innerText = 'Global';
}

// ==========================================
// ACTUALIZAR MÉTRICAS (ACTUALIZADO PARA PERFILES DINÁMICOS)
// ==========================================
function updateIndexMetrics(stats) {
    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value.toLocaleString();
    };
    setStat('visit-count', parseInt(stats.visitas_totales) || 0);
    setStat('metric-visitas', parseInt(stats.visitas_totales) || 0);
    setStat('metric-estudiantes', Object.keys(dbUsers).length);
    setStat('metric-paises', Object.keys(stats).filter(k => k.startsWith('visita_pais_')).length);
    
    // Actualizar todos los contadores de perfil dinámicamente
    Object.keys(stats).forEach(key => {
        if (key.startsWith('perfil_')) {
            const perfilKey = key.replace('perfil_', '');
            const countEl = document.getElementById(`cnt-${perfilKey}`);
            if (countEl) {
                countEl.innerText = stats[key] || 0;
            }
        }
    });
    
    // Compatibilidad con IDs antiguos
    setStat('cntIng', stats.perfil_ingeniero || 0);
    setStat('cntTsu', stats.perfil_tsu || 0);
    setStat('cntEst', stats.perfil_estudiante || 0);
    
    let totalLikes = 0;
    Object.keys(stats).forEach(key => { if (key.endsWith('_likes')) totalLikes += parseInt(stats[key] || 0); });
    setStat('metric-likes', totalLikes);
    setStat('metric-descargas', parseInt(stats.descargas_totales) || 0);
}

// ==========================================
// CARGAR GOOGLE CHARTS
// ==========================================
function loadGoogleCharts() {
    if (googleChartsLoaded) {
        drawGlobalMapAndRank(globalStats);
        return;
    }
    if (googleChartsLoading) return;
    googleChartsLoading = true;
    
    try {
        if (typeof google === 'undefined') {
            googleChartsLoading = false;
            return;
        }
        google.charts.load('current', { 'packages': ['geochart'], 'language': 'es' });
        google.charts.setOnLoadCallback(() => {
            googleChartsLoaded = true;
            googleChartsLoading = false;
            drawGlobalMapAndRank(globalStats);
        });
    } catch (error) {
        googleChartsLoading = false;
    }
}

// ==========================================
// DIBUJAR MAPA GLOBAL
// ==========================================
function drawGlobalMapAndRank(stats) {
    try {
        const mapContainer = document.getElementById('visitorMapGlobal');
        if (!mapContainer || typeof google === 'undefined' || !google.visualization) return;
        
        const mapData = [['País', 'Visitas']];
        if (stats) {
            Object.keys(stats).forEach(key => {
                if (key.startsWith('visita_pais_')) {
                    const countryName = key.replace('visita_pais_', '');
                    const visits = parseInt(stats[key]) || 0;
                    if (visits > 0) {
                        const lowerName = countryName.toLowerCase().trim();
                        const isoCode = countryToISO[lowerName];
                        if (isoCode) {
                            mapData.push([{ v: isoCode.toUpperCase(), f: countryName }, visits]);
                        } else {
                            mapData.push([countryName, visits]);
                        }
                    }
                }
            });
        }
        if (mapData.length <= 1) {
            mapData.push(['Venezuela', 100], ['Colombia', 50], ['México', 30]);
        }
        
        const data = google.visualization.arrayToDataTable(mapData);
        const chart = new google.visualization.GeoChart(mapContainer);
        chart.draw(data, {
            backgroundColor: 'transparent',
            datalessRegionColor: '#1e293b',
            colorAxis: { colors: ['#1e3a5f', '#2db8ce', '#4ade80'] },
            legend: 'none',
            width: '100%',
            height: '100%'
        });
        
        updateCountryRanking(stats);
    } catch (error) {
        console.error('Error dibujando mapa:', error);
    }
}

// ==========================================
// ACTUALIZAR RANKING DE PAÍSES
// ==========================================
function updateCountryRanking(stats) {
    const rankContainer = document.getElementById('countryRankListGlobal');
    if (!rankContainer) return;
    
    const rankData = [];
    if (stats) {
        Object.keys(stats).forEach(key => {
            if (key.startsWith('visita_pais_')) {
                const countryName = key.replace('visita_pais_', '');
                const visits = parseInt(stats[key]) || 0;
                if (visits > 0) rankData.push({ country: countryName, visits });
            }
        });
    }
    if (rankData.length === 0) {
        rankData.push({ country: 'Venezuela', visits: 100 }, { country: 'Colombia', visits: 50 });
    }
    rankData.sort((a, b) => b.visits - a.visits);
    
    rankContainer.innerHTML = rankData.slice(0, 10).map((item, index) => {
        const isoCode = countryToISO[item.country.toLowerCase()];
        const flagHtml = isoCode 
            ? `<img src="https://flagcdn.com/w40/${isoCode}.png" class="w-6 h-4 object-cover rounded shadow-sm" alt="${item.country}">` 
            : `<i class="fas fa-globe text-slate-500"></i>`;
        const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600', 'text-slate-400'];
        const rankClass = index < 3 ? rankColors[index] : rankColors[3];
        return `
            <div class="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 transition-all duration-300 cursor-default">
                <div class="flex items-center gap-3">
                    <span class="font-black ${rankClass} text-sm w-5 text-center">${index + 1}</span>
                    ${flagHtml}
                    <span class="font-semibold text-white text-sm tracking-wide">${item.country}</span>
                </div>
                <span class="font-black text-cyan-400 text-sm tabular-nums">${item.visits.toLocaleString()}</span>
            </div>`;
    }).join('');
}

// ==========================================
// CARGAR DATOS
// ==========================================
async function loadData(showIndicator = true) {
    try {
        const res = await fetch(`${API_URL}?action=get_data&t=${Date.now()}`);
        const data = await res.json();
        if(data.status === 'success') {
            dbUsers = data.users || {}; 
            globalStats = data.stats || {};

            if (currentUser && currentUser.email) {
                const serverUser = dbUsers[currentUser.email.toLowerCase()];
                if (serverUser) {
                    currentUser = { ...currentUser, ...serverUser };
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            }
            return true;
        }
        return false;
    } catch (e) { return false; }
}

// ==========================================
// CARGAR PÁGINA
// ==========================================
async function loadHomePageData() {
    try {
        const response = await fetch(`${API_URL}?action=get_home_page&t=${Date.now()}`);
        const data = await response.json();
        if (data.status === 'success') {
            homePageData = {
                hero: data.data.hero || [],
                instructor: data.data.instructor || [],
                cursos_destacados: data.data.cursos_destacados || [],
                manuales: data.data.manuales || [],
                modalidades: data.data.modalidades || [],
                curso_especial: data.data.curso_especial || [],
                metodologia: data.data.metodologia || [],
                testimonios: data.data.testimonios || [],
                faq: data.data.faq || [],
                cta: data.data.cta || [],
                mision: data.data.mision || [],
                comunidad: data.data.comunidad || []
            };
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error cargando datos de página:', error);
        return false;
    }
}


// ==========================================
// EXPANSIÓN DE TARJETAS DE METODOLOGÍA (CLONE AL BODY)
// ==========================================
let methodologyClone = null;
let methodologyOriginal = null;

function initMethodologyCards() {
    const cards = document.querySelectorAll('.methodology-card');
    if (!cards.length) return;

    // Crear overlay si no existe
    let overlay = document.querySelector('.card-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        document.body.appendChild(overlay);
    }

    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (methodologyClone) return; // Ya hay una expandida
            expandMethodologyCard(card, overlay);
        });
    });

    overlay.addEventListener('click', closeExpandedMethodologyCard);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeExpandedMethodologyCard();
    });
}

function expandMethodologyCard(card, overlay) {
    const rect = card.getBoundingClientRect();

    // Clonar la tarjeta y ponerla en el body (fuera de stacking contexts)
    methodologyOriginal = card;
    methodologyClone = card.cloneNode(true);

    // Estilos iniciales del clon (posición exacta de la original)
    methodologyClone.style.position = 'fixed';
    methodologyClone.style.top = rect.top + 'px';
    methodologyClone.style.left = rect.left + 'px';
    methodologyClone.style.width = rect.width + 'px';
    methodologyClone.style.height = rect.height + 'px';
    methodologyClone.style.margin = '0';
    methodologyClone.style.zIndex = '100011';
    methodologyClone.style.transition = 'all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)';
    methodologyClone.classList.remove('reveal', 'reveal-up', 'delay-100', 'delay-200', 'delay-300');

    // Ocultar original
    card.style.visibility = 'hidden';

    // Agregar clon al body
    document.body.appendChild(methodologyClone);

    // Activar overlay
    overlay.classList.add('visible');

    // Forzar reflow
    void methodologyClone.offsetWidth;

    // Animar al centro
    requestAnimationFrame(() => {
        methodologyClone.classList.add('is-expanded');
    });
}

function closeExpandedMethodologyCard() {
    if (!methodologyClone) return;

    const overlay = document.querySelector('.card-overlay');

    // Quitar clase expandida para animar de vuelta
    methodologyClone.classList.remove('is-expanded');
    if (overlay) overlay.classList.remove('visible');

    // Esperar la transición y limpiar
    setTimeout(() => {
        if (methodologyClone && methodologyClone.parentNode) {
            methodologyClone.parentNode.removeChild(methodologyClone);
        }
        if (methodologyOriginal) {
            methodologyOriginal.style.visibility = '';
        }
        methodologyClone = null;
        methodologyOriginal = null;
    }, 500);
}
// ==========================================
// MOSTRAR TODAS LAS SECCIONES DE GOLPE
// ==========================================
function revealAllSections() {
    document.querySelectorAll('.section-loading').forEach(el => {
        el.classList.add('loaded');
    });
    // Reactivar animaciones reveal
    setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }, 100);
}

// ==========================================
// MOSTRAR MÉTRICAS
// ==========================================
function revealMetrics() {
    const metrics = document.getElementById('metrics');
    if (metrics) {
        metrics.classList.remove('section-loading');
        metrics.classList.add('metrics-loading');
        // Forzar reflow
        void metrics.offsetWidth;
        metrics.classList.add('loaded');
    }
}

// ==========================================
// FUNCIONES AUXILIARES PARA BADGES MÚLTIPLES
// ==========================================
function getBadgeTags(badge) {
    if (!badge || badge.trim() === '') return [];
    return badge.split('|').map(s => s.trim()).filter(s => s);
}

function getLevelInfoFromTags(tags) {
    const levelOrder = ['Avanzado', 'Intermedio', 'Básico'];
    let detectedLevel = null;
    for (const level of levelOrder) {
        if (tags.some(tag => tag.toLowerCase().includes(level.toLowerCase()))) {
            detectedLevel = level;
            break;
        }
    }
    if (!detectedLevel) detectedLevel = 'Básico';

    const levelMap = {
        'Básico': {
            levelClass: 'course-card-level-basico',
            badgeClass: 'badge-basic',
            iconClass: 'fa-seedling text-cyan-400',
            iconBg: 'bg-cyan-500/10 border-cyan-500/30'
        },
        'Intermedio': {
            levelClass: 'course-card-level-intermedio',
            badgeClass: 'badge-intermediate',
            iconClass: 'fa-cogs text-purple-400',
            iconBg: 'bg-purple-500/10 border-purple-500/30'
        },
        'Avanzado': {
            levelClass: 'course-card-level-avanzado',
            badgeClass: 'badge-avanzado',
            iconClass: 'fa-rocket text-amber-400',
            iconBg: 'bg-amber-500/10 border-amber-500/30'
        }
    };
    return levelMap[detectedLevel];
}

function renderBadgeTags(tags) {
    if (!tags || tags.length === 0) return '';
    const badges = tags.map(tag => {
        const lower = tag.toLowerCase();
        let badgeClass = 'badge-generic';
        if (lower.includes('básico') || lower.includes('basico')) badgeClass = 'badge-basic';
        else if (lower.includes('intermedio')) badgeClass = 'badge-intermediate';
        else if (lower.includes('avanzado')) badgeClass = 'badge-avanzado';
        return `<span class="course-card-badge ${badgeClass}">${tag}</span>`;
    }).join('');
    return `<div class="badge-container">${badges}</div>`;
}

// ==========================================
// RENDERIZAR TODAS LAS SECCIONES
// ==========================================
function renderHomePage() {
    // Hero
    if (homePageData.hero.length > 0) {
        const hero = homePageData.hero[0];
        const heroTitle = document.querySelector('.hero-main-title');
        if (heroTitle && hero.titulo) {
            heroTitle.innerHTML = hero.titulo.replace('AUTOMATIZACIÓN', '<span class="text-secondary">AUTOMATIZACIÓN</span>');
        }
        const heroDesc = document.querySelector('.text-blue-50');
        if (heroDesc && hero.descripcion) heroDesc.textContent = hero.descripcion;
    }
    
    // Instructor
    if (homePageData.instructor.length > 0) {
        const inst = homePageData.instructor[0];
        const section = document.querySelector('#instructor');
        if (section) {
            const img = section.querySelector('img');
            if (img && inst.imagen_url) img.src = inst.imagen_url;
            const name = section.querySelector('h2');
            if (name && inst.titulo) {
                const parts = inst.titulo.split(' ');
                if (parts.length >= 2) name.innerHTML = `Prof. ${parts[0]} <span>${parts.slice(1).join(' ')}</span>`;
            }
            const desc = section.querySelector('p');
            if (desc && inst.descripcion) desc.textContent = inst.descripcion;
        }
    }
    
    // Misión académica
    if (homePageData.mision && homePageData.mision.length > 0) {
        const mision = homePageData.mision[0];
        const section = document.querySelector('#mision');
        if (section) {
            const subtituloEl = section.querySelector('.section-subtitle');
            if (subtituloEl && mision.subtitulo) subtituloEl.textContent = mision.subtitulo;
            
            const tituloEl = section.querySelector('h2');
            if (tituloEl && mision.titulo) {
                const parts = mision.titulo.split(' ');
                if (parts.length >= 2) {
                    tituloEl.innerHTML = `${parts[0]} <span>${parts.slice(1).join(' ')}</span>`;
                } else {
                    tituloEl.textContent = mision.titulo;
                }
            }
            
            const imgEl = section.querySelector('.mission-card img');
            if (imgEl && mision.imagen_url) imgEl.src = mision.imagen_url;
            
            const h3El = section.querySelector('.mission-card h3');
            if (h3El && mision.descripcion) h3El.textContent = mision.descripcion;
            
            const ulEl = section.querySelector('.mission-card ul');
            if (ulEl) {
                let items = [];
                if (mision.badge && mision.badge.trim() !== '') {
                    items = mision.badge.split('|').map(s => s.trim()).filter(s => s);
                }
                if (items.length === 0) {
                    items = [
                        'Educación Práctica: Contenido actualizado para la industria.',
                        'Acceso para Todos: Democratizar el conocimiento.',
                        'Comunidad y Soporte: Aprendizaje colaborativo.'
                    ];
                }
                ulEl.innerHTML = items.map(item => {
                    const colonIndex = item.indexOf(':');
                    if (colonIndex > 0) {
                        const boldPart = item.substring(0, colonIndex).trim();
                        const normalPart = item.substring(colonIndex + 1).trim();
                        return `
                            <li class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-cyan-400 mt-1.5"></i>
                                <span><strong>${boldPart}:</strong> ${normalPart}</span>
                            </li>`;
                    } else {
                        return `
                            <li class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-cyan-400 mt-1.5"></i>
                                <span>${item}</span>
                            </li>`;
                    }
                }).join('');
            }
        }
    }
    
    // Comunidad - Perfiles
    if (homePageData.comunidad && homePageData.comunidad.length > 0) {
        const comunidad = homePageData.comunidad[0];
        const section = document.querySelector('#comunidad');
        if (section) {
            const tituloEl = section.querySelector('h2');
            if (tituloEl && comunidad.titulo) {
                if (comunidad.titulo.includes('realizan')) {
                    tituloEl.innerHTML = '¿Quiénes realizan <br><span>nuestros cursos?</span>';
                } else {
                    tituloEl.innerHTML = comunidad.titulo;
                }
            }
            const descEl = section.querySelector('p');
            if (descEl && comunidad.descripcion) {
                descEl.textContent = comunidad.descripcion;
            }
            const buttonsContainer = section.querySelector('.space-y-4');
            if (buttonsContainer) {
                let perfiles = [];
                if (comunidad.badge && comunidad.badge.trim() !== '') {
                    perfiles = comunidad.badge.split('|').map(s => s.trim()).filter(s => s);
                }
                if (perfiles.length === 0) {
                    perfiles = ['Ingeniero', 'TSU', 'Estudiante'];
                }
                const iconMap = {
                    'ingeniero': 'fa-user-tie text-blue-700',
                    'tsu': 'fa-cogs text-cyan-700',
                    'estudiante': 'fa-user-graduate text-teal-700',
                    'bachiller': 'fa-user text-purple-700',
                    'inces': 'fa-hard-hat text-orange-700',
                    'técnico': 'fa-tools text-green-700',
                    'tecnico': 'fa-tools text-green-700',
                    'técnico superior': 'fa-tools text-green-700',
                    'tecnico superior': 'fa-tools text-green-700',
                    'licenciado': 'fa-user-tie text-indigo-700',
                    'profesional': 'fa-briefcase text-red-700',
                    'egresado': 'fa-graduation-cap text-emerald-700',
                    'pregrado': 'fa-book text-pink-700',
                    'postgrado': 'fa-book-open text-amber-700',
                    'obrero': 'fa-hard-hat text-yellow-700',
                    'supervisor': 'fa-clipboard-check text-sky-700',
                    'gerente': 'fa-chart-line text-violet-700',
                    'docente': 'fa-chalkboard-teacher text-rose-700',
                    'investigador': 'fa-flask text-cyan-700',
                    'empresario': 'fa-building text-blue-700',
                    'tecnólogo': 'fa-microchip text-teal-700',
                    'tecnologo': 'fa-microchip text-teal-700',
                    'estudiante de pregrado': 'fa-book text-pink-700',
                    'estudiante de postgrado': 'fa-book-open text-amber-700',
                    'estudiante universitario': 'fa-user-graduate text-teal-700'
                };
                buttonsContainer.innerHTML = perfiles.map((perfil, index) => {
                    const perfilNormalizado = perfil.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    const perfilKey = perfilNormalizado.replace(/\s+/g, '_');
                    const iconClass = iconMap[perfilNormalizado] || iconMap[perfilKey] || 'fa-user text-slate-400';
                    const count = globalStats[`perfil_${perfilKey}`] || 0;
                    return `
                    <button onclick="regCom('${perfilKey}')" id="btn-${perfilKey}" class="prof-btn w-full p-5 rounded-3xl flex items-center gap-6">
                        <i class="fas ${iconClass} text-3xl"></i>
                        <span class="text-base font-black uppercase">${perfil}</span>
                        <div class="prof-count-bg ml-auto px-3 py-1 rounded-full"><span id="cnt-${perfilKey}" class="font-black">${count}</span></div>
                    </button>`;
                }).join('');
                
                const savedProfile = localStorage.getItem('user_profile_selected');
                if (savedProfile) {
                    const btn = document.getElementById(`btn-${savedProfile}`);
                    if (btn) btn.classList.add('prof-selected');
                }
            }
        }
    }
    
    // Cursos Destacados
    if (homePageData.cursos_destacados.length > 0) {
        const container = document.querySelector('#cursos-destacados .grid');
        if (container) {
            container.innerHTML = homePageData.cursos_destacados.map((curso, index) => {
                const courseNum = curso.id ? (curso.id.match(/\d+/) || [index + 1])[0] : (index + 1);
                const dataId = `curso-${courseNum}`;
                const isLiked = currentUser && currentUser.likedCourses && currentUser.likedCourses.includes(dataId);
                const tags = getBadgeTags(curso.badge);
                const levelInfo = getLevelInfoFromTags(tags);
                const badgesHTML = renderBadgeTags(tags);
                return `
                <div class="course-card ${levelInfo.levelClass} reveal reveal-up">
                    <div class="course-card-image-container">
                        <img src="${curso.imagen_url || 'img/AA (1).gif'}" class="course-card-image" onerror="this.src='img/AA (1).gif'">
                        ${badgesHTML}
                        <div class="absolute bottom-3 left-3 flex items-center justify-center ${levelInfo.iconBg} border-2 rounded-full w-10 h-10">
                            <i class="fas ${levelInfo.iconClass} text-lg"></i>
                        </div>
                    </div>
                    <div class="course-card-content">
                        <h3 class="course-card-title">${curso.titulo}</h3>
                        <p class="course-card-description">${curso.descripcion || ''}</p>
                        <div class="course-card-footer">
                            <div class="course-card-meta">
                                <div class="course-card-price">${curso.precio || ''}</div>
                                <div class="course-card-stats">
                                    <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${dataId}" onclick="toggleLike(this)">
                                        <i class="fas fa-heart"></i><span class="like-count">${globalStats[`${dataId}_likes`] || 0}</span>
                                    </button>
                                    <div class="view-container ${(globalStats[`${dataId}_vistas`] || 0) > 0 ? 'has-views' : ''}">
                                        <i class="fas fa-eye"></i><span>${globalStats[`${dataId}_vistas`] || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="course-card-buttons">
                                ${curso.enlace_info ? `<button onclick="registerViewAndGo('${curso.enlace_info}', ${courseNum}, '_self')" class="btn-metal-solid btn-metal-cyan w-full !py-3 !text-[10px] !rounded-xl">Info</button>` : ''}
                                ${curso.enlace_compra ? `<button onclick="window.open('${curso.enlace_compra}', '_blank')" class="btn-metal-solid btn-metal-teal w-full !py-3 !text-[10px] !rounded-xl">Comprar</button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    }
    
    // Manuales y Recursos
    if (homePageData.manuales.length > 0) {
        const container = document.querySelector('#manuales .grid');
        if (container) {
            container.innerHTML = homePageData.manuales.map((manual, index) => {
                const manualNum = manual.id ? (manual.id.match(/\d+/) || [index + 20])[0] : (index + 20);
                const tags = getBadgeTags(manual.badge);
                const levelInfo = getLevelInfoFromTags(tags);
                const badgesHTML = renderBadgeTags(tags);
                return `
                <div class="course-card ${levelInfo.levelClass} reveal reveal-up">
                    <div class="course-card-image-container">
                        <img src="${manual.imagen_url || 'img/AA (1).gif'}" class="course-card-image" onerror="this.src='img/AA (1).gif'">
                        ${badgesHTML}
                        <div class="absolute bottom-3 left-3 flex items-center justify-center ${levelInfo.iconBg} border-2 rounded-full w-10 h-10">
                            <i class="fas ${levelInfo.iconClass} text-lg"></i>
                        </div>
                    </div>
                    <div class="course-card-content">
                        <h3 class="course-card-title">${manual.titulo}</h3>
                        <p class="course-card-description">${manual.descripcion || ''}</p>
                        <div class="course-card-footer">
                            <div class="course-card-meta"><div class="course-card-price">${manual.precio || ''}</div></div>
                            <div class="course-card-buttons">
                                ${manual.enlace_info ? `<button onclick="registerViewAndGo('${manual.enlace_info}', ${manualNum}, '_self')" class="btn-metal-solid btn-metal-cyan w-full !py-3 !text-[10px] !rounded-xl">Info</button>` : ''}
                                ${manual.enlace_compra ? `<button onclick="window.open('${manual.enlace_compra}', '_blank')" class="btn-metal-solid btn-metal-teal w-full !py-3 !text-[10px] !rounded-xl">Comprar</button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    }
    
    // Modalidades
    if (homePageData.modalidades.length > 0) {
        const container = document.querySelector('#modalidades .grid');
        if (container) {
            container.innerHTML = homePageData.modalidades.map((modalidad, index) => {
                const caracteristicas = modalidad.badge 
                    ? modalidad.badge.split('|').map(s => s.trim()).filter(s => s) 
                    : [];
                const listaViñetas = caracteristicas.length > 0 
                    ? `<ul class="modalidad-list mt-4 space-y-2">
                        ${caracteristicas.map(item => `
                            <li class="flex items-start gap-2 text-sm">
                                <i class="fas fa-check-circle text-cyan-500 mt-1"></i>
                                <span>${item}</span>
                            </li>`).join('')}
                       </ul>` 
                    : '';
                const botones = `
                    <div class="course-card-buttons mt-6">
                        ${modalidad.enlace_info ? `<button onclick="registerViewAndGo('${modalidad.enlace_info}', ${index + 30}, '_self')" class="btn-metal-solid btn-metal-cyan w-full !py-3 !text-[10px] !rounded-xl"><i class="fas fa-info-circle mr-1"></i> Más Información</button>` : ''}
                        ${modalidad.enlace_compra ? `<button onclick="window.open('${modalidad.enlace_compra}', '_blank')" class="btn-metal-solid btn-metal-teal w-full !py-3 !text-[10px] !rounded-xl"><i class="fas fa-shopping-cart mr-1"></i> Comprar</button>` : ''}
                    </div>`;
                const tituloNormalizado = modalidad.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                let logoUrl = '';
                if (tituloNormalizado.includes('presencial')) {
                    logoUrl = 'img/AA (40).webp';
                } else if (tituloNormalizado.includes('online')) {
                    logoUrl = 'img/AA (38).webp';
                }
                const logoHTML = logoUrl 
                    ? `<div class="modalidad-logo-bg" style="background-image: url('${logoUrl}');" title="Logo ${modalidad.titulo}"></div>` 
                    : '';
                return `
                    <div class="course-card course-card-level-basico reveal reveal-up flex flex-col md:flex-row overflow-hidden">
                        <div class="course-card-content flex-1 p-6 md:p-8">
                            <div class="flex items-center gap-2 mb-2">
                                ${logoHTML}
                                <h3 class="course-card-title !m-0">${modalidad.titulo}</h3>
                            </div>
                            <p class="course-card-description">${modalidad.descripcion || ''}</p>
                            ${listaViñetas}
                            ${botones}
                        </div>
                        <div class="course-card-image-container modalidad-image-container md:w-1/2 lg:w-2/5 shrink-0 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none"></div>
                            <img src="${modalidad.imagen_url || 'img/AA (1).gif'}" 
                                 alt="${modalidad.titulo}" 
                                 class="course-card-image w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                                 onerror="this.src='img/AA (1).gif'">
                        </div>
                    </div>`;
            }).join('');
        }
    }
    
    // Curso Especial
    if (homePageData.curso_especial.length > 0) {
        const especial = homePageData.curso_especial[0];
        const container = document.querySelector('#curso-especial .special-course-card');
        if (container && especial.titulo) {
            const words = especial.titulo.split(' ');
            const titleHtml = words.length > 1 ? `${words[0]} <span class="text-[#2db8ce]">${words.slice(1).join(' ')}</span>` : especial.titulo;
            const institucion = especial.institucion || 'Universidad Politécnica Territorial de Aragua (UPT Aragua)';
            const fechas = especial.fechas || 'Próximamente';
            const horario = especial.horario || '8:00 a.m. a 2:00 p.m.';
            const duracion = especial.duracion || '2 Viernes intensivos';
            const participantes = especial.participantes || '12 participantes, 2 participantes por mesón de trabajo.';
            container.innerHTML = `
            <div class="w-full lg:w-2/5 relative flex-shrink-0 lg:aspect-square">
                <img src="${especial.imagen_url || 'img/AA (1).gif'}" alt="${especial.titulo}" class="special-course-image lg:absolute lg:inset-0 w-full h-full object-cover" onerror="this.src='img/AA (1).gif'">
                <div class="absolute top-6 left-6 z-20 flex items-center justify-center bg-purple-500/10 border-2 border-purple-500/30 backdrop-blur-sm rounded-full w-12 h-12 shadow-lg" title="Nivel Intermedio">
                    <i class="fas fa-cogs text-xl text-purple-400"></i>
                </div>
                <div class="absolute top-6 right-6 z-20">
                    <span class="px-4 py-2 bg-teal-500/20 backdrop-blur-lg text-teal-400 text-[10px] font-black uppercase rounded-full border border-teal-500/30">Inscripciones Abiertas</span>
                </div>
                <div class="absolute bottom-6 left-6 right-6 z-20">
                    ${especial.enlace_info ? `<button onclick="registerViewAndGo('${especial.enlace_info}', 10, '_self')" class="btn-metal-solid btn-metal-cyan w-full mb-3 !py-3 !text-xs !rounded-xl"><i class="fas fa-info-circle"></i> Info del Curso</button>` : ''}
                    ${especial.enlace_compra ? `<button onclick="window.open('${especial.enlace_compra}', '_blank')" class="btn-metal-solid btn-metal-teal w-full !py-4 !text-xs !rounded-2xl !font-black !uppercase !flex !items-center !justify-center !gap-3"><i class="fab fa-whatsapp"></i> Solicitar Inscripción</button>` : ''}
                </div>
            </div>
            <div class="lg:w-3/4 p-8 lg:p-12 flex flex-col justify-center">
                <div>
                    <span class="section-subtitle text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">${especial.subtitulo || 'Curso de ampliación y extensión profesional'}</span>
                    <h4 class="text-2xl lg:text-4xl font-black uppercase leading-tight mb-4 text-white">${titleHtml}</h4>
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 rounded-2xl bg-[#2db8ce]/10 flex items-center justify-center border border-[#2db8ce]/20 shrink-0"><i class="fas fa-university text-[#2db8ce] text-sm"></i></div>
                                <div><span class="text-[9px] font-black uppercase tracking-widest block mb-1">Institución</span><p class="text-xs font-bold text-white">${institucion}</p></div>
                            </div>
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 rounded-2xl bg-[#2db8ce]/10 flex items-center justify-center border border-[#2db8ce]/20 shrink-0"><i class="fas fa-calendar-alt text-[#2db8ce] text-sm"></i></div>
                                <div><span class="text-[9px] font-black uppercase tracking-widest block mb-1">Fechas</span><p class="text-xs font-bold text-white">${fechas}</p></div>
                            </div>
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 rounded-2xl bg-[#2db8ce]/10 flex items-center justify-center border border-[#2db8ce]/20 shrink-0"><i class="fas fa-clock text-[#2db8ce] text-sm"></i></div>
                                <div><span class="text-[9px] font-black uppercase tracking-widest block mb-1">Horario</span><p class="text-xs font-bold text-white">${horario}</p></div>
                            </div>
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 rounded-2xl bg-[#2db8ce]/10 flex items-center justify-center border border-[#2db8ce]/20 shrink-0"><i class="fas fa-hourglass-half text-[#2db8ce] text-sm"></i></div>
                                <div><span class="text-[9px] font-black uppercase tracking-widest block mb-1">Duración</span><p class="text-xs font-bold text-white">${duracion}</p></div>
                            </div>
                        </div>
                        <div class="pt-6 border-t flex items-start gap-3 border-white/10">
                            <i class="fas fa-users text-[#2db8ce] text-sm mt-1"></i>
                            <div>
                                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">CANTIDAD DE PARTICIPANTES:</span>
                                <p class="text-white text-xs font-bold">${participantes}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    
    // Metodología
    if (homePageData.metodologia.length > 0) {
        const container = document.querySelector('#metodologia .grid');
        if (container) {
            container.innerHTML = homePageData.metodologia.map((met, index) => {
                const expandedText = met.badge || met.descripcion || '';
                return `
                <div class="bg-white/5 rounded-[40px] p-6 text-left reveal reveal-up methodology-card" data-index="${index}">
                    <div class="image-zoom-container h-48 mb-6 overflow-hidden rounded-3xl">
                        <img src="${met.imagen_url || 'img/AA (1).gif'}" class="w-full h-full object-cover" onerror="this.src='img/AA (1).gif'">
                    </div>
                    <div class="methodology-card-text-content">
                        <h3 class="text-white text-xl font-black uppercase mb-3">${met.titulo}</h3>
                        <p class="text-slate-400 text-sm methodology-short-desc">${met.descripcion || ''}</p>
                        <div class="methodology-expanded-content">
                            <p>${expandedText}</p>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    }
    
    // Testimonios
    if (homePageData.testimonios.length > 0) {
        const container = document.querySelector('#testimonios .grid');
        if (container) {
            container.innerHTML = homePageData.testimonios.map((test, index) => {
                const initials = test.titulo ? test.titulo.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??';
                let imageUrl = test.imagen_url || '';
                if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('https') && !imageUrl.startsWith('data:')) {
                    if (!imageUrl.startsWith('img/') && !imageUrl.startsWith('./img/') && !imageUrl.startsWith('/')) {
                        imageUrl = 'img/' + imageUrl;
                    }
                }
                let imageHTML = '';
                if (imageUrl && imageUrl.trim() !== '') {
                    imageHTML = `
                        <img src="${imageUrl}" alt="${test.titulo}" 
                             class="course-card-image w-full h-48 object-cover opacity-100" 
                             style="opacity:1; mix-blend-mode:normal; image-rendering:auto;"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="w-full h-full hidden items-end justify-center bg-[#dfe5e7]">
                            <svg class="w-[140px] h-[140px] text-white -mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>`;
                } else {
                    imageHTML = `
                        <div class="w-full h-full flex items-end justify-center bg-[#dfe5e7]">
                            <svg class="w-[140px] h-[140px] text-white -mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>`;
                }
                return `
                <div class="course-card course-card-level-basico reveal reveal-up flex flex-col overflow-hidden">
                    <div class="course-card-image-container h-48 w-full bg-slate-900 relative">
                        ${imageHTML}
                    </div>
                    <div class="course-card-content flex flex-col flex-grow p-6 md:p-8 relative">
                        <i class="fas fa-quote-right absolute top-6 right-6 text-4xl text-[#2db8ce] opacity-20 z-0"></i>
                        <div class="relative z-10">
                            <div class="flex gap-1 text-yellow-400 mb-4 text-sm">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            </div>
                            <p class="text-sm italic mb-8 text-gray-600 dark:text-slate-300">"${test.descripcion || ''}"</p>
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-black text-xl flex-shrink-0">${initials}</div>
                                <div>
                                    <h4 class="font-bold text-sm text-gray-800 dark:text-white">${test.titulo}</h4>
                                    <span class="testimonial-role text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-slate-400">${test.subtitulo || ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    }
    
    // FAQ
    if (homePageData.faq.length > 0) {
        const container = document.querySelector('#faq .space-y-4');
        if (container) {
            container.innerHTML = homePageData.faq.map((faq, index) => `
                <details class="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer">
                    <summary class="font-bold text-white">${faq.titulo}</summary>
                    <div class="text-slate-400 mt-4"><p>${faq.descripcion || ''}</p></div>
                </details>`).join('');
        }
    }
    
    // CTA
    if (homePageData.cta.length > 0) {
        const cta = homePageData.cta[0];
        const section = document.querySelector('#contacto');
        if (section) {
            const titleEl = section.querySelector('h2');
            if (titleEl && cta.titulo) titleEl.textContent = cta.titulo;
            const descEl = section.querySelector('p');
            if (descEl && cta.descripcion) descEl.textContent = cta.descripcion;
            const btn = section.querySelector('button');
            if (btn && cta.enlace_compra) btn.onclick = () => window.open(cta.enlace_compra, '_blank');
        }
    }
    
    setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }, 100);
}

// ==========================================
// TOAST
// ==========================================
function showLoadingToast() {
    const toast = document.getElementById('loadingToast');
    if (toast) { toast.classList.remove('hidden', 'hiding', 'success-toast'); toast.style.opacity = '1'; }
}
function showSuccessToast() {
    const toast = document.getElementById('loadingToast');
    if (toast) { toast.classList.remove('hidden', 'hiding'); toast.classList.add('success-toast'); setTimeout(() => hideLoadingToast(), 3000); }
}
function hideLoadingToast() {
    const toast = document.getElementById('loadingToast');
    if (toast) { toast.classList.add('hiding'); setTimeout(() => toast.classList.add('hidden'), 500); }
}
function showNotif(title, msg, type = 'success') {
    console.log(`📢 ${title}: ${msg}`);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log('🚀 Inicializando página...');
    currentUser = loadCurrentUser();
    showLoadingToast();
    initScrollReveal();
    initVisitorInfo();

    // Cargar datos de página y stats en paralelo
    const [pageLoaded, statsLoaded] = await Promise.all([
        loadHomePageData(),
        loadData(false)
    ]);

    // Renderizar AHORA que globalStats ya está cargado
    renderHomePage();

    // Inicializar tarjetas expandibles de metodología
    initMethodologyCards();

    // Una vez todo renderizado, mostrar todas las secciones de golpe
    revealAllSections();
    hideLoadingToast();

    // Luego de mostrar el contenido, cargar métricas con delay
    setTimeout(() => {
        updateIndexMetrics(globalStats);
        revealMetrics();
    }, 800);

    const profession = currentUser?.profession || localStorage.getItem('user_profile_selected');
    if (profession) {
        const btn = document.getElementById(`btn-${profession}`);
        if (btn) btn.classList.add('prof-selected');
    }
    if (currentUser?.likedCourses) {
        currentUser.likedCourses.forEach(courseId => {
            const likeBtn = document.querySelector(`.like-btn[data-id="${courseId}"]`);
            if (likeBtn) likeBtn.classList.add('liked');
        });
    }
    document.querySelectorAll('.prof-btn').forEach(b => { b.disabled = false; b.style.opacity = '1'; });

    setTimeout(() => loadGoogleCharts(), 1500);

    console.log('✅ Inicialización completada');
});