// js/app.js - Lógica específica para index.html

const countryToISO = { "venezuela": "ve", "colombia": "co", "méxico": "mx", "mexico": "mx", "españa": "es", "spain": "es", "argentina": "ar", "perú": "pe", "peru": "pe", "chile": "cl", "ecuador": "ec", "bolivia": "bo", "paraguay": "py", "uruguay": "uy", "costa rica": "cr", "panamá": "pa", "panama": "pa", "república dominicana": "do", "republica dominicana": "do", "guatemala": "gt", "honduras": "hn", "el salvador": "sv", "nicaragua": "ni", "cuba": "cu", "puerto rico": "pr", "puertorico": "pr", "estados unidos": "us", "united states": "us", "usa": "us", "francia": "fr", "france": "fr", "brasil": "br", "brazil": "br", "italy": "it", "italia": "it", "alemania": "de", "germany": "de", "canadá": "ca", "canada": "ca", "reino unido": "gb", "united kingdom": "gb", "portugal": "pt", "haití": "ht", "haiti": "ht", "japon": "jp", "japón": "jp", "china": "cn", "rusia": "ru", "russia": "ru", "bélgica": "be", "belgium": "be", "suiza": "ch", "switzerland": "ch", "jamaica": "jm", "trinidad y tobago": "tt", "guyana": "gy", "surinam": "sr", "belice": "bz", "bahamas": "bs", "barbados": "bb", "santa lucía": "lc", "granada": "gd", "san vicente y las granadinas": "vc", "antigua y barbuda": "ag", "dominica": "dm", "san cristóbal y nieves": "kn" };
const countryAliases = { "ve": "Venezuela", "venezuela": "Venezuela", "co": "Colombia", "colombia": "Colombia", "mx": "México", "mexico": "México", "es": "España", "spain": "España", "ar": "Argentina", "argentina": "Argentina", "pe": "Perú", "peru": "Perú", "cl": "Chile", "chile": "Chile", "ec": "Ecuador", "ecuador": "Ecuador", "bo": "Bolivia", "bolivia": "Bolivia", "py": "Paraguay", "paraguay": "Paraguay", "uy": "Uruguay", "uruguay": "Uruguay", "cr": "Costa Rica", "costa rica": "Costa Rica", "pa": "Panamá", "panama": "Panamá", "do": "República Dominicana", "república dominicana": "República Dominicana", "republica dominicana": "República Dominicana", "gt": "Guatemala", "guatemala": "Guatemala", "hn": "Honduras", "honduras": "Honduras", "sv": "El Salvador", "el salvador": "El Salvador", "ni": "Nicaragua", "nicaragua": "Nicaragua", "cu": "Cuba", "cuba": "Cuba", "pr": "Puerto Rico", "puerto rico": "Puerto Rico", "puertorico": "Puerto Rico", "us": "Estados Unidos", "estados unidos": "Estados Unidos", "united states": "Estados Unidos", "usa": "Estados Unidos", "fr": "Francia", "francia": "Francia", "france": "Francia", "br": "Brasil", "brasil": "Brasil", "brazil": "Brasil", "it": "Italia", "italia": "Italia", "italy": "Italia", "de": "Alemania", "alemania": "Alemania", "germany": "Alemania", "ca": "Canadá", "canadá": "Canadá", "canada": "Canadá", "gb": "Reino Unido", "reino unido": "Reino Unido", "united kingdom": "Reino Unido", "pt": "Portugal", "portugal": "Portugal", "ht": "Haití", "haití": "Haití", "haiti": "Haití", "jp": "Japón", "japon": "Japón", "japón": "Japón", "cn": "China", "china": "China", "ru": "Rusia", "rusia": "Rusia", "russia": "Rusia", "be": "Bélgica", "bélgica": "Bélgica", "belgium": "Bélgica", "ch": "Suiza", "suiza": "Suiza", "switzerland": "Suiza", "jm": "Jamaica", "jamaica": "Jamaica", "tt": "Trinidad y Tobago", "trinidad y tobago": "Trinidad y Tobago", "gy": "Guyana", "guyana": "Guyana", "sr": "Surinam", "surinam": "Surinam", "bz": "Belice", "belice": "Belice", "bs": "Bahamas", "bahamas": "Bahamas", "bb": "Barbados", "barbados": "Barbados", "lc": "Santa Lucía", "santa lucía": "Santa Lucía", "gd": "Granada", "granada": "Granada", "vc": "San Vicente y las Granadinas", "san vicente y las granadinas": "San Vicente y las Granadinas", "ag": "Antigua y Barbuda", "antigua y barbuda": "Antigua y Barbuda", "dm": "Dominica", "dominica": "Dominica", "kn": "San Cristóbal y Nieves", "san cristóbal y nieves": "San Cristóbal y Nieves" };

let dbUsers = {};
let globalStats = {};

async function loadData(showIndicator = true) {
    if (showIndicator && typeof showSyncIndicator === 'function') {
        showSyncIndicator('Conectando con la base de datos...', 'loading');
    }
    try {
        // Usamos la URL de la API definida en auth.js para consistencia
        const res = await fetch(`${AuthLogic.API_URL}?action=get_data&t=${Date.now()}`);
        const data = await res.json();
        
        if(data.status === 'success') {
            dbUsers = data.users || {}; 
            globalStats = data.stats || {};
            
            if (showIndicator && typeof showSyncIndicator === 'function') {
                showSyncIndicator('Datos sincronizados correctamente', 'success');
            }
        } else {
            throw new Error('La respuesta del servidor no fue exitosa');
        }
    } catch (e) { 
        console.error("Error al cargar la data global del Excel:", e); 
        if (showIndicator && typeof showSyncIndicator === 'function') {
            showSyncIndicator('Modo sin conexión', 'error');
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Deshabilitar botones de profesión para evitar clics antes de que carguen los datos
    document.querySelectorAll('.prof-btn').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

    // Inicializar funciones de UI específicas de esta página
    initScrollReveal();
    await initVisitorInfo();
    
    await loadData(true);
    updateIndexMetrics(globalStats);
    updateFeaturedCoursesStats(globalStats);
    updateLikeButtons();

    google.charts.load('current', { 'packages':['geochart'], 'language': 'es' });
    google.charts.setOnLoadCallback(() => drawGlobalMapAndRank(globalStats));
    
    // Inicializar iconos si la librería está presente
    if(window.lucide) {
        lucide.createIcons();
    }

    // Comprobar si ya se seleccionó un perfil y actuar en consecuencia
    let selectedProfile = localStorage.getItem('user_profile_selected');

    // Si el usuario está logueado y tiene una profesión, esta tiene prioridad
    if (AuthLogic.currentUser && AuthLogic.currentUser.profession) {
        selectedProfile = AuthLogic.currentUser.profession;
        localStorage.setItem('user_profile_selected', selectedProfile);
    }

    if (selectedProfile) {
        const selectedBtn = document.getElementById(`btn-${selectedProfile}`);
        if (selectedBtn) selectedBtn.classList.add('prof-selected');
    }

    // Habilitar los botones ahora que los datos han cargado
    document.querySelectorAll('.prof-btn').forEach(b => { b.disabled = false; b.style.opacity = '1'; });

    // --- Lógica para tarjetas flotantes (Metodología y Testimonios) ---
    const expandableCards = document.querySelectorAll('.methodology-card, .testimonial-card');
    const cardOverlay = document.createElement('div');
    cardOverlay.className = 'card-overlay';
    document.body.appendChild(cardOverlay);

    let activeCard = null;
    let cardPlaceholder = null;

    const closeActiveCard = () => {
        if (!activeCard) return;

        const cardToClose = activeCard;
        document.body.classList.remove('card-active');
        cardToClose.classList.remove('is-expanded');
        cardOverlay.classList.remove('visible');

        cardToClose.addEventListener('transitionend', function onEnd() {
            cardToClose.removeEventListener('transitionend', onEnd);

            cardToClose.classList.remove('is-expanding');
            cardToClose.style.top = '';
            cardToClose.style.left = '';
            cardToClose.style.width = '';
            cardToClose.style.height = '';

            if (cardPlaceholder && cardPlaceholder.parentNode) {
                cardPlaceholder.parentNode.removeChild(cardPlaceholder);
            }
            
            activeCard = null;
            cardPlaceholder = null;
        });
    };

    expandableCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('is-expanding')) {
                closeActiveCard();
            } else if (!activeCard) {
                activeCard = card;
                const rect = card.getBoundingClientRect();

                cardPlaceholder = document.createElement('div');
                cardPlaceholder.style.width = `${rect.width}px`;
                cardPlaceholder.style.height = `${rect.height}px`;
                card.parentNode.insertBefore(cardPlaceholder, card);

                card.classList.add('is-expanding');
                card.style.top = `${rect.top}px`;
                card.style.left = `${rect.left}px`;
                card.style.width = `${rect.width}px`;
                card.style.height = `${rect.height}px`;

                setTimeout(() => {
                    document.body.classList.add('card-active');
                    card.classList.add('is-expanded');
                    cardOverlay.classList.add('visible');
                }, 10);
            }
        });
    });

    cardOverlay.addEventListener('click', closeActiveCard);
});

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach(el => observer.observe(el));
}

async function initVisitorInfo() {
    const services = [ 'https://get.geojs.io/v1/ip/geo.json', 'https://api.country.is', 'https://ipapi.co/json/' ];
    for (const service of services) {
        try {
            const controller = new AbortController(); 
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(service, { signal: controller.signal }); 
            clearTimeout(timeoutId);
            if (!res.ok) continue; 
            const data = await res.json();
            
            let rawCountryName = data.country || data.countryName || data.country_name || "";
            let countryCode = data.country_code || data.countryCode || data.country || "";
            
            if (rawCountryName && rawCountryName !== "Desconocido") {
                let baseName = countryAliases[rawCountryName.toLowerCase().trim()] || rawCountryName;
                let finalISO = countryToISO[baseName.toLowerCase().trim()] || (countryCode ? countryCode.toLowerCase() : null);
                
                document.getElementById('visitor-country').innerText = baseName;
                const flagEl = document.getElementById('visitor-flag');
                if(flagEl && finalISO) { 
                    flagEl.src = `https://flagcdn.com/w20/${finalISO}.png`; 
                    flagEl.classList.remove('hidden'); 
                }
                document.getElementById('visitor-info').classList.remove('opacity-0');
                
                if(typeof ping === 'function') {
                    ping('update_stat', 'visitas_totales'); 
                    ping('update_stat', 'visita_pais_' + baseName);
                }
                return;
            }
        } catch (e) { console.warn(`Fallo ${service}`); }
    }

    // Fallback si todos los servicios de geolocalización fallan, para asegurar que la pastilla se muestre
    document.getElementById('visitor-country').innerText = 'Global';
    document.getElementById('visitor-info').classList.remove('opacity-0');
    if(typeof ping === 'function') {
        ping('update_stat', 'visitas_totales'); 
    }
}

function updateIndexMetrics(stats) {
    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value.toLocaleString();
    };
    const totalVisitas = parseInt(stats.visitas_totales || stats.total_visitas) || 0;
    setStat('visit-count', totalVisitas);
    setStat('metric-visitas', totalVisitas);
    setStat('metric-estudiantes', Object.keys(dbUsers).length);
    setStat('metric-paises', Object.keys(stats).filter(k => k.startsWith('visita_pais_')).length);
    setStat('cntIng', stats.perfil_ingeniero || 0);
    setStat('cntTsu', stats.perfil_tsu || 0);
    setStat('cntEst', stats.perfil_estudiante || 0);

    let totalLikes = 0;
    Object.keys(stats).forEach(key => { if (key.endsWith('_likes')) totalLikes += parseInt(stats[key] || 0); });
    setStat('metric-likes', totalLikes);
    const totalDescargas = parseInt(stats.descargas_totales) || 0;
    setStat('metric-descargas', totalDescargas);
}

function drawGlobalMapAndRank(stats) {
    try {
        if (!google || !google.visualization || !document.getElementById('visitorMapGlobal')) return;
        
        const aggregatedVisits = {};

        Object.keys(stats).forEach(key => { 
            if (key.startsWith('visita_pais_')) {
                const originalName = key.replace('visita_pais_', '');
                const lowerCaseName = originalName.toLowerCase().trim();
                const canonicalName = countryAliases[lowerCaseName] || originalName;
                const visits = parseInt(stats[key]) || 0;

                if (aggregatedVisits[canonicalName]) {
                    aggregatedVisits[canonicalName] += visits;
                } else {
                    aggregatedVisits[canonicalName] = visits;
                }
            }
        });

        const mapDataArr = [['Country', 'Visitas']];
        const rankData = [];
        Object.keys(aggregatedVisits).forEach(countryName => {
            const visits = aggregatedVisits[countryName];
            const cleanCountry = countryName.toLowerCase().trim();
            const isoCode = countryToISO[cleanCountry] || countryToISO[cleanCountry.replace(/\s/g, '')];
            
            if (isoCode) {
                mapDataArr.push([{ v: isoCode.toUpperCase(), f: countryName }, visits]);
            } else {
                mapDataArr.push([countryName, visits]);
            }
            rankData.push({ country: countryName, visits });
        });

        // Dibujar mapa
        const chart = new google.visualization.GeoChart(document.getElementById('visitorMapGlobal')); 
        chart.draw(google.visualization.arrayToDataTable(mapDataArr), { 
            backgroundColor: 'transparent',
            datalessRegionColor: '#1e293b',
            colorAxis: { colors: ['#2db8ce', '#1877f2'] },
            region: 'world'
        });

        // Dibujar ranking
        const rankContainer = document.getElementById('countryRankListGlobal');
        if (rankContainer) {
            rankData.sort((a, b) => b.visits - a.visits);
            rankContainer.innerHTML = rankData.slice(0, 10).map((item, index) => {
                const cleanCountry = item.country.toLowerCase().trim();
                const isoCode = countryToISO[cleanCountry] || countryToISO[cleanCountry.replace(/\s/g, '')];
                const flagHtml = isoCode 
                    ? `<img src="https://flagcdn.com/w20/${isoCode}.png" class="w-5 h-auto rounded-[3px] shadow-sm" alt="${item.country}">` 
                    : `<div class="w-5 h-auto flex items-center justify-center"><i class="fas fa-globe text-slate-500"></i></div>`;

                return `<div class="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="font-bold text-slate-400 text-xs w-5 text-center flex-shrink-0">${index + 1}</span>
                        <div class="w-5 flex-shrink-0">${flagHtml}</div>
                        <span class="font-semibold text-white text-sm truncate">${item.country}</span>
                    </div>
                    <span class="font-black text-cyan-400 text-sm">${item.visits.toLocaleString()}</span>
                </div>
            `}).join('');
        }
    } catch (e) {
        console.error("Error al dibujar el mapa:", e);
    }
}

function showNotif(title, msg, type = 'success') {
    const n = document.getElementById('notification');
    if (!n) return;
    const icon = document.getElementById('notifIcon');
    const titleEl = document.getElementById('notifTitle');
    const msgEl = document.getElementById('notifMsg');

    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = msg;

    n.classList.remove('bg-teal-600', 'bg-blue-600', 'bg-red-600');
    if (icon) {
        if (type === 'error') { n.classList.add('bg-red-600'); icon.className = 'fas fa-exclamation-circle text-2xl'; } 
        else if (type === 'info') { n.classList.add('bg-blue-600'); icon.className = 'fas fa-info-circle text-2xl'; }
        else { n.classList.add('bg-teal-600'); icon.className = 'fas fa-check-circle text-2xl'; }
    }
    
    n.classList.add('show');
    setTimeout(() => {
        n.classList.remove('show');
    }, 4000);
}

function updateFeaturedCoursesStats(stats) {
    // Actualizar likes
    document.querySelectorAll('#cursos-destacados .like-btn').forEach(btn => {
        const courseId = btn.dataset.id; // e.g., "curso-2"
        if (courseId) {
            const likeCountSpan = btn.querySelector('.like-count');
            const likes = stats[`${courseId}_likes`] || 0;
            if (likeCountSpan) {
                likeCountSpan.innerText = likes;
            }
        }
    });

    // Actualizar vistas
    document.querySelectorAll('#cursos-destacados .view-count').forEach(span => {
        const courseId = span.dataset.id; // e.g., "curso-2"
        if (courseId) {
            const views = stats[`${courseId}_vistas`] || 0;
            span.innerText = views;
            const parentDiv = span.parentElement;
            if (parentDiv) {
                // La clase 'has-views' se encargará del estilo en CSS
                if (views > 0) parentDiv.classList.add('has-views');
                else parentDiv.classList.remove('has-views');
            }
        }
    });
}

function updateLikeButtons() {
    if (!AuthLogic.currentUser || !AuthLogic.currentUser.likedCourses) return;
    document.querySelectorAll('#cursos-destacados .like-btn').forEach(btn => {
        const courseId = btn.dataset.id;
        if (AuthLogic.currentUser.likedCourses.includes(courseId)) {
            btn.classList.add('liked');
        } else {
            btn.classList.remove('liked');
        }
    });
}

function registerViewAndGo(url, courseId, target = '_blank') {
    const idKey = `curso-${courseId}`;
    ping('update_stat', `${idKey}_vistas`);
    if (globalStats) {
        globalStats[`${idKey}_vistas`] = (parseInt(globalStats[`${idKey}_vistas`]) || 0) + 1;
        document.querySelectorAll(`#cursos-destacados .view-count[data-id="${idKey}"]`).forEach(span => {
            span.innerText = globalStats[`${idKey}_vistas`];
            const parentDiv = span.parentElement;
            if (parentDiv) {
                parentDiv.classList.add('has-views');
            }
        });
    }
    window.open(url, target);
}

function ping(action, key) {
    try {
        const url = AuthLogic.API_URL;
        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, new URLSearchParams({action, key}));
        } else {
            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `action=${encodeURIComponent(action)}&key=${encodeURIComponent(key)}` });
        }
    } catch (e) { console.error('Ping error:', e); }
}

async function syncUserProgressToExcel() {
    if (!AuthLogic.currentUser || !AuthLogic.currentUser.email) return;
    const email = AuthLogic.currentUser.email.toLowerCase();
    const userData = JSON.stringify(AuthLogic.currentUser);
    try {
        await fetch(AuthLogic.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=update_user&email=${encodeURIComponent(email)}&userData=${encodeURIComponent(userData)}`
        });
    } catch (e) { console.error('Sync error:', e); }
}

function toggleLike(btn) {
    AuthUI.requireAuth(() => {
        const id = btn.dataset.id;
        if (!AuthLogic.currentUser.likedCourses) AuthLogic.currentUser.likedCourses = [];
        const span = btn.querySelector('.like-count');
        let currentLikes = parseInt(span.innerText) || 0;

        if (AuthLogic.currentUser.likedCourses.includes(id)) {
            AuthLogic.currentUser.likedCourses = AuthLogic.currentUser.likedCourses.filter(c => c !== id);
            ping('decrement_stat', `${id}_likes`);
            btn.classList.remove('liked');
            span.innerText = Math.max(0, currentLikes - 1);
            if (globalStats) globalStats[`${id}_likes`] = Math.max(0, currentLikes - 1);
        } else {
            AuthLogic.currentUser.likedCourses.push(id);
            ping('update_stat', `${id}_likes`);
            btn.classList.add('liked');
            span.innerText = currentLikes + 1;
            if (globalStats) globalStats[`${id}_likes`] = currentLikes + 1;
        }
        
        localStorage.setItem('user', JSON.stringify(AuthLogic.currentUser));
        syncUserProgressToExcel();
    });
}

function regCom(profile) {
    const previousProfile = localStorage.getItem('user_profile_selected');

    // Evitar registrar el mismo voto múltiples veces
    if (previousProfile === profile) {
        showNotif('Voto ya registrado', 'Gracias, pero tu selección ya fue contada.', 'info');
        return;
    }

    // Si el usuario está cambiando su voto, decrementar el contador anterior
    if (previousProfile) {
        const oldStatKey = `perfil_${previousProfile}`;
        ping('decrement_stat', oldStatKey);
        if (globalStats) {
            globalStats[oldStatKey] = Math.max(0, (parseInt(globalStats[oldStatKey]) || 1) - 1);
            let oldElId = `cnt${previousProfile.charAt(0).toUpperCase() + previousProfile.slice(1).substring(0,2)}`;
            if (previousProfile === 'tsu') oldElId = 'cntTsu';
            const oldEl = document.getElementById(oldElId);
            if (oldEl) oldEl.innerText = globalStats[oldStatKey];
        }
    }

    // Quitar la selección de otros botones para permitir cambiar el voto
    document.querySelectorAll('.prof-btn').forEach(b => b.classList.remove('prof-selected'));

    const selectedBtn = document.getElementById(`btn-${profile}`);
    if (selectedBtn) selectedBtn.classList.add('prof-selected');
    
    const statKey = `perfil_${profile}`;
    ping('update_stat', statKey);

    if (globalStats) {
        globalStats[statKey] = (parseInt(globalStats[statKey]) || 0) + 1;
        let countElId = `cnt${profile.charAt(0).toUpperCase() + profile.slice(1).substring(0,2)}`;
        if (profile === 'tsu') countElId = 'cntTsu';
        const countEl = document.getElementById(countElId);
        if (countEl) countEl.innerText = globalStats[statKey];
    }
    
    localStorage.setItem('user_profile_selected', profile);

    // Si hay un usuario logueado, actualizamos su perfil con la profesión
    if (AuthLogic.currentUser) {
        AuthLogic.currentUser.profession = profile;
        localStorage.setItem('user', JSON.stringify(AuthLogic.currentUser));
        syncUserProgressToExcel(); // Sincroniza el objeto de usuario completo con el backend
    }

    if (typeof showNotif === 'function') {
        const message = previousProfile ? 'Tu selección ha sido actualizada.' : 'Tu perfil ha sido registrado en nuestras estadísticas.';
        showNotif('¡Gracias por participar!', message, 'success');
    }
}
