// ==========================================
// SCRIPT DE APRENDE AUTOMATIZACIÓN - PÁGINA DE INICIO
// (ACTUALIZADO - CURSOS DESTACADOS CON VALORACIONES Y COMPRA DIRECTA)
// ==========================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxnc_quYbnUZ6j1E1QGaMNRmyRCLqCQVWLTG5y4Z_gJ4ErXtFUrG2D3md0RW1bLW8na/exec';

const countryToISO = { "venezuela": "ve", "colombia": "co", "méxico": "mx", "mexico": "mx", "españa": "es", "spain": "es", "argentina": "ar", "perú": "pe", "peru": "pe", "chile": "cl", "ecuador": "ec", "bolivia": "bo", "paraguay": "py", "uruguay": "uy", "costa rica": "cr", "panamá": "pa", "panama": "pa", "república dominicana": "do", "guatemala": "gt", "honduras": "hn", "el salvador": "sv", "nicaragua": "ni", "cuba": "cu", "puerto rico": "pr", "estados unidos": "us", "francia": "fr", "brasil": "br", "italia": "it", "alemania": "de", "canadá": "ca", "reino unido": "gb", "portugal": "pt", "haití": "ht", "japon": "jp", "china": "cn", "rusia": "ru", "bélgica": "be", "suiza": "ch", "jamaica": "jm" };

const countryAliases = { "ve": "Venezuela", "venezuela": "Venezuela", "co": "Colombia", "colombia": "Colombia", "mx": "México", "mexico": "México", "es": "España", "spain": "España", "ar": "Argentina", "argentina": "Argentina", "pe": "Perú", "peru": "Perú", "cl": "Chile", "chile": "Chile", "ec": "Ecuador", "ecuador": "Ecuador", "bo": "Bolivia", "bolivia": "Bolivia", "py": "Paraguay", "paraguay": "Paraguay", "uy": "Uruguay", "uruguay": "Uruguay", "cr": "Costa Rica", "costa rica": "Costa Rica", "pa": "Panamá", "panama": "Panamá", "do": "República Dominicana", "gt": "Guatemala", "hn": "Honduras", "sv": "El Salvador", "ni": "Nicaragua", "cu": "Cuba", "pr": "Puerto Rico", "us": "Estados Unidos", "fr": "Francia", "br": "Brasil", "it": "Italia", "de": "Alemania", "ca": "Canadá", "gb": "Reino Unido", "pt": "Portugal", "ht": "Haití", "jp": "Japón", "cn": "China", "ru": "Rusia", "be": "Bélgica", "ch": "Suiza", "jm": "Jamaica" };

const VENEZUELA_FLAG_URL = 'https://kimi-web-img.kimi.ai/img/uxwing.com/f24e2335a62518177fba5ade4992594201597458.png';

let dbUsers = {};
let globalStats = {};
let currentUser = null;
let homePageData = {
    hero: [], instructor: [], cursos_destacados: [], manuales: [],
    modalidades: [], curso_especial: [], metodologia: [],
    testimonios: [], faq: [], cta: [], mision: [], comunidad: []
};
let catalogoCursos = [];
let dbUserCourses = {};
let dbUserDetails = {};
let dbUserProgress = {};
let dbUserPaymentStatus = {};
let dbUserAccessStatus = {};
let studentCountsPerCourse = {};
let courseRatings = {};
let tasaBCVGlobal = null;

let googleChartsLoaded = false;
let googleChartsLoading = false;

// Variables para el modal de compra
let cursoSeleccionadoHome = null;
let cursoPrecioUSDHome = 0;
let tasaBCVHome = 0;

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
// REGISTRAR PROFESIÓN
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
    if (!currentUser) { 
        showNotif('Acceso requerido', 'Debes iniciar sesión para dar like.', 'info');
        return; 
    }
    const id = btn.dataset.id;
    if (!currentUser.likedCourses) currentUser.likedCourses = [];
    const span = btn.querySelector('.like-count');
    let currentLikes = parseInt(span.innerText) || 0;
    
    if (currentUser.likedCourses.includes(id)) {
        currentUser.likedCourses = currentUser.likedCourses.filter(c => c !== id);
        ping('decrement_stat', `${id}_likes`);
        btn.classList.remove('liked', 'text-red-500');
        btn.classList.add('text-slate-400');
        span.innerText = Math.max(0, currentLikes - 1);
    } else {
        currentUser.likedCourses.push(id);
        ping('update_stat', `${id}_likes`);
        btn.classList.add('liked', 'text-red-500');
        btn.classList.remove('text-slate-400');
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
    if (globalStats) globalStats[`curso-${courseId}_vistas`] = (parseInt(globalStats[`curso-${courseId}_vistas`]) || 0) + 1;
    if (url && url !== '#') window.open(url, target);
}

// ==========================================
// ABRIR/CERRAR MODAL
// ==========================================
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// ==========================================
// VALORAR CURSO (SISTEMA DE ESTRELLAS)
// ==========================================
function rateCourse(courseId, rating) {
    if (!currentUser) {
        showNotif('Acceso requerido', 'Debes iniciar sesión para valorar cursos.', 'info');
        return;
    }
    
    if (!currentUser.ratings) currentUser.ratings = {};
    currentUser.ratings[courseId] = rating;
    
    const email = currentUser.email.toLowerCase();
    if (dbUsers[email]) {
        let userObj = dbUsers[email];
        if (typeof userObj === 'string') { 
            try { userObj = JSON.parse(userObj); } catch(e) { userObj = {}; } 
        }
        userObj = userObj || {};
        userObj.ratings = currentUser.ratings;
        dbUsers[email] = JSON.stringify(userObj);
    }
    
    localStorage.setItem('user', JSON.stringify(currentUser));
    calculateCourseRatings();
    
    // Re-renderizar los cursos destacados para actualizar las estrellas
    rJFExu5NouR7CUdQrUbMPjxysaRauzYP5b();
    
    syncUserData();
    showNotif('Valoración guardada', `Has puntuado con ${rating} estrellas.`, 'success');
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
// ACTUALIZAR MÉTRICAS
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
    
    Object.keys(stats).forEach(key => {
        if (key.startsWith('perfil_')) {
            const perfilKey = key.replace('perfil_', '');
            const countEl = document.getElementById(`cnt-${perfilKey}`);
            if (countEl) {
                countEl.innerText = stats[key] || 0;
            }
        }
    });
    
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
            dbUserCourses = data.userCourses || {};
            dbUserDetails = data.userDetails || {};
            dbUserProgress = data.userProgress || {};
            dbUserPaymentStatus = data.userPaymentStatus || {};
            dbUserAccessStatus = data.userAccessStatus || {};

            if (currentUser && currentUser.email) {
                const serverUser = dbUsers[currentUser.email.toLowerCase()];
                if (serverUser) {
                    currentUser = { ...currentUser, ...serverUser };
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            }
            
            calculateCourseRatings();
            updateStudentCounts();
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
// CARGAR CATÁLOGO DE CURSOS
// ==========================================
async function loadCatalogoCursos() {
    try {
        const response = await fetch(`${API_URL}?action=get_courses&nocache=${Date.now()}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            let coursesArray = [];
            
            if (Array.isArray(result.data)) {
                coursesArray = result.data;
            } else if (Array.isArray(result.cursos)) {
                coursesArray = result.cursos;
            } else if (Array.isArray(result)) {
                coursesArray = result;
            }
            
            if (coursesArray.length > 0) {
                catalogoCursos = coursesArray.map(course => {
                    return {
                        ID: course.ID || course.id || course.Id || '',
                        Nombre: course.Nombre || course.nombre || course.titulo || 'Sin nombre',
                        Tipo: course.Tipo || course.tipo || 'Curso',
                        Categoria: course.Categoria || course.categoria || '',
                        Nivel: course.Nivel || course.nivel || 'Básico',
                        Descripcion: course.Descripcion || course.descripcion || course.descripción || '',
                        ImagenURL: course.ImagenURL || course.imagenURL || course.imagen_url || course.imagen || 'https://placehold.co/600x400/1e293b/2db8ce?text=Curso',
                        Precio: course.Precio || course.precio || '0',
                        Moneda: course.Moneda || course.moneda || '$',
                        EnlaceInfo: course.EnlaceInfo || course.enlaceInfo || course.enlace_info || course.enlace || '#',
                        EnlaceAula: course.EnlaceAula || course.enlaceAula || course.enlace_aula || '',
                        EnlaceCompra: course.EnlaceCompra || course.enlaceCompra || course.enlace_compra || '',
                        EnlaceMaterial: course.EnlaceMaterial || course.enlaceMaterial || course.enlace_material || '',
                        TotalLecciones: course.TotalLecciones || course.totalLecciones || course.total_lecciones || 0,
                        NombresModulos: course.NombresModulos || course.nombresModulos || course.nombres_modulos || '',
                        Badges: course.Badges || course.badges || '',
                        Activo: course.Activo || course.activo || 'SI',
                        ProfesorNombre: course.ProfesorNombre || course.profesorNombre || (course.profesor && course.profesor.nombre) || '',
                        ProfesorFoto: course.ProfesorFoto || course.profesorFoto || (course.profesor && course.profesor.foto) || '',
                        ProfesorResena: course.ProfesorResena || course.profesorResena || (course.profesor && course.profesor.resena) || '',
                        ProfesorEspecialidad: course.ProfesorEspecialidad || course.profesorEspecialidad || (course.profesor && course.profesor.especialidad) || '',
                        Destacado: course.Destacado || course.destacado || false
                    };
                });
                
                console.log('📚 Catálogo cargado:', catalogoCursos.length, 'cursos');
                const destacados = catalogoCursos.filter(c => {
                    const dest = String(c.Destacado || '').toUpperCase().trim();
                    return dest === 'TRUE' || dest === 'SI' || dest === 'YES' || dest === '1' || dest === 'SÍ';
                });
                console.log('⭐ Destacados:', destacados.length);
                return catalogoCursos;
            }
        }
        return [];
    } catch (error) {
        console.error('Error cargando catálogo:', error);
        return [];
    }
}

// ==========================================
// OBTENER CURSOS DESTACADOS
// ==========================================
function getCursosDestacadosFromCatalogo() {
    const destacados = catalogoCursos.filter(curso => {
        const dest = String(curso.Destacado || '').toUpperCase().trim();
        return dest === 'TRUE' || dest === 'SI' || dest === 'YES' || dest === '1' || dest === 'SÍ';
    });
    
    const cursosFinales = destacados.length > 0 
        ? destacados.slice(0, 3) 
        : catalogoCursos.slice(0, 3);
    
    console.log('📚 Cursos destacados seleccionados:', cursosFinales.length);
    return cursosFinales;
}

// ==========================================
// CALCULAR RATINGS DE CURSOS
// ==========================================
function calculateCourseRatings() {
    courseRatings = {};
    catalogoCursos.forEach(c => courseRatings[c.ID || c.id] = { sum: 0, count: 0, avg: "5.0" });
    for (const email in dbUsers) {
        let u = dbUsers[email];
        if (typeof u === 'string') { try { u = JSON.parse(u); } catch(e) { u = {}; } }
        if (u && u.ratings) {
            for (const cid in u.ratings) {
                if (courseRatings[cid]) { 
                    courseRatings[cid].sum += Number(u.ratings[cid]) || 0; 
                    courseRatings[cid].count++; 
                }
            }
        }
    }
    for (const cid in courseRatings) { 
        if (courseRatings[cid].count > 0) {
            courseRatings[cid].avg = (courseRatings[cid].sum / courseRatings[cid].count).toFixed(1); 
        }
    }
}

// ==========================================
// ACTUALIZAR CONTEO DE ESTUDIANTES
// ==========================================
function updateStudentCounts() {
    catalogoCursos.forEach(c => studentCountsPerCourse[c.ID || c.id] = 0);
    for (const email in dbUserCourses) {
        const courses = dbUserCourses[email] || [];
        if (Array.isArray(courses)) {
            courses.forEach(courseName => {
                const found = catalogoCursos.find(c => 
                    (c.Nombre || c.nombre || '').toLowerCase().trim() === String(courseName).toLowerCase().trim()
                );
                if (found) {
                    studentCountsPerCourse[found.ID || found.id] = (studentCountsPerCourse[found.ID || found.id] || 0) + 1;
                }
            });
        }
    }
}

// ==========================================
// OBTENER TASA BCV
// ==========================================
async function obtenerTasaBCVGlobal() {
    try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await response.json();
        if (data && data.promedio) {
            tasaBCVGlobal = data.promedio;
            console.log('✅ Tasa BCV:', tasaBCVGlobal);
        }
    } catch (error) {
        console.error('Error al obtener tasa BCV:', error);
        tasaBCVGlobal = 49.50;
    }
}

// ==========================================
// RENDERIZAR CURSOS DESTACADOS (CON VALORACIONES)
// ==========================================
function rJFExu5NouR7CUdQrUbMPjxysaRauzYP5b() {
    const container = document.getElementById('cursos-destacados-container');
    if (!container) {
        console.error('❌ Contenedor de cursos destacados no encontrado');
        return;
    }
    
    const cursosDestacados = getCursosDestacadosFromCatalogo();
    
    if (cursosDestacados.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-500 col-span-full">No hay cursos destacados disponibles.</p>';
        return;
    }
    
    container.innerHTML = cursosDestacados.map(course => generateCourseCardHTML(course)).join('');
    
    setTimeout(() => {
        document.querySelectorAll('#cursos-destacados-container .reveal').forEach(el => el.classList.add('active'));
    }, 100);
    
    console.log('✅ Cursos destacados renderizados con valoraciones');
}

// ==========================================
// GENERAR TARJETA DE CURSO (CON VALORACIONES)
// ==========================================
function generateCourseCardHTML(course) {
    const courseId = String(course.ID || course.id || '');
    const courseName = course.Nombre || course.nombre || 'Sin nombre';
    const courseType = course.Tipo || course.tipo || 'Curso';
    const courseCategory = course.Categoria || course.categoria || '';
    const courseLevel = course.Nivel || course.nivel || 'Básico';
    const coursePrice = parseFloat(course.Precio || course.precio || 0);
    const courseCurrency = course.Moneda || course.moneda || '$';
    const courseImage = course.ImagenURL || course.imagen_url || 'https://placehold.co/600x400/1e293b/2db8ce?text=Curso';
    const courseLink = course.EnlaceInfo || course.enlace_info || '#';
    const courseBadges = course.Badges || course.badges || '';
    const courseDescription = course.Descripcion || course.descripcion || '';
    const profesorNombre = course.ProfesorNombre || course.profesorNombre || '';
    const profesorFoto = course.ProfesorFoto || course.profesorFoto || '';
    const profesorEspecialidad = course.ProfesorEspecialidad || course.profesorEspecialidad || '';
    
    // Variables para el sistema de valoración
    const isLogged = currentUser !== null;
    let userRating = 0;
    if (currentUser && currentUser.ratings && currentUser.ratings[courseId]) {
        userRating = currentUser.ratings[courseId];
    }
    
    const email = currentUser ? currentUser.email.toLowerCase() : '';
    const key = email + '|' + courseName;
    const estadoPago = dbUserPaymentStatus[key] || null;
    const acceso = dbUserAccessStatus[key] || 'NO';
    const isAccessGranted = (acceso === 'SÍ' || acceso === 'SI' || acceso === 'TRUE' || acceso === 'true' || acceso === true);
    
    let estadoClase = '';
    let badgeEstadoHTML = '';
    let botonHTML = '';
    let mensajeEstado = '';
    let showOverlay = false;
    let overlayText = '';
    
    if (isAccessGranted) {
        estadoClase = 'estado-inscrito';
        badgeEstadoHTML = `<span class="badge-estado badge-inscrito"><i class="fas fa-check-circle"></i> ✅ Inscrito</span>`;
        botonHTML = `<span class="btn-inscrito-pastilla"><i class="fas fa-check-circle"></i> Inscrito</span>`;
    } else if (estadoPago === 'Pendiente') {
        estadoClase = 'estado-pendiente';
        badgeEstadoHTML = `<span class="badge-estado badge-pendiente"><i class="fas fa-clock"></i> ⏳ Pendiente</span>`;
        botonHTML = `<button class="btn-pendiente" disabled><i class="fas fa-clock"></i> Pendiente</button>`;
        mensajeEstado = `<div class="mt-1 text-[10px] text-amber-400 text-center">⏳ Esperando verificación de pago</div>`;
        showOverlay = true;
        overlayText = 'Pago pendiente de verificación';
    } else if (estadoPago === 'Revisión' || estadoPago === 'REVISIÓN') {
        estadoClase = 'estado-pendiente';
        badgeEstadoHTML = `<span class="badge-estado badge-revision"><i class="fas fa-spinner fa-spin"></i> 🔄 Revisión</span>`;
        botonHTML = `<button class="btn-pendiente" disabled><i class="fas fa-spinner fa-spin"></i> Revisando</button>`;
        mensajeEstado = `<div class="mt-1 text-[10px] text-blue-400 text-center">🔄 Tu pago está en revisión</div>`;
        showOverlay = true;
        overlayText = 'Pago en revisión';
    } else if (estadoPago === 'Rechazado' || estadoPago === 'RECHAZADO') {
        estadoClase = 'estado-rechazado';
        badgeEstadoHTML = `<span class="badge-estado badge-rechazado"><i class="fas fa-times-circle"></i> ❌ Rechazado</span>`;
        botonHTML = `<button onclick="event.stopPropagation(); abrirModalCompraFromHome('${courseId}')" class="btn-rechazado"><i class="fas fa-redo"></i> Reintentar</button>`;
        mensajeEstado = `<div class="mt-1 text-[10px] text-red-400 text-center">❌ Pago rechazado. Reintenta la compra.</div>`;
        showOverlay = true;
        overlayText = 'Pago rechazado';
    } else {
        estadoClase = '';
        badgeEstadoHTML = `<span class="badge-estado" style="background:rgba(148,163,184,0.2);color:#94a3b8;border:1px solid rgba(148,163,184,0.2);">Disponible</span>`;
        if (coursePrice === 0) {
            botonHTML = `<button onclick="event.stopPropagation(); enrollFreeCourseFromHome('${courseId}', '${courseName.replace(/'/g, "\\'")}')" class="btn-comprar"><i class="fas fa-gift"></i> Inscribirse Gratis</button>`;
        } else {
            botonHTML = `<button onclick="event.stopPropagation(); abrirModalCompraFromHome('${courseId}')" class="btn-comprar"><i class="fas fa-shopping-cart"></i> Comprar</button>`;
        }
    }

    let badgesHTML = '';
    if (courseBadges) {
        badgesHTML = courseBadges.split('|').map(badge => {
            const trimmedBadge = badge.trim();
            if (trimmedBadge) return `<span class="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-md">${trimmedBadge}</span>`;
            return '';
        }).join('');
    }

    const tasaActual = tasaBCVGlobal || 49.50;
    const precioBs = coursePrice * tasaActual;
    const precioBsFormateado = `Bs. ${precioBs.toFixed(2)}`;

    const priceTag = coursePrice === 0 ? 
        '<span class="text-[#2db8ce] font-extrabold italic text-lg">GRATIS</span>' : 
        `<div class="flex flex-col items-end">
            <span class="text-lg font-black text-slate-800">${courseCurrency}${coursePrice.toFixed(2)}</span>
            <span class="precio-bs mt-0.5"><img src="${VENEZUELA_FLAG_URL}" alt="🇻🇪" style="width:16px;height:11px;object-fit:cover;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:4px;box-shadow:0 1px 2px rgba(0,0,0,0.2);">${precioBsFormateado}</span>
        </div>`;

    const likes = globalStats[`curso-${courseId}_likes`] || 0;
    const vistas = globalStats[`curso-${courseId}_vistas`] || 0;
    const isLikedClass = (currentUser && currentUser.likedCourses && currentUser.likedCourses.includes(`curso-${courseId}`)) ? 'liked text-red-500' : 'text-slate-400';
    const viewsClass = vistas > 0 ? 'text-green-500' : 'text-slate-400';
    const avgRating = courseRatings[courseId] ? courseRatings[courseId].avg : "5.0";
    const displayCount = studentCountsPerCourse[courseId] !== undefined ? studentCountsPerCourse[courseId] : '...';

    const normalizedLevel = (courseLevel || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let levelBorderClass = '';
    let levelBadgeStyle = '';
    if (normalizedLevel === 'basico' || normalizedLevel === 'básico') {
        levelBorderClass = 'course-card-level-basico';
        levelBadgeStyle = 'background-color: rgba(6,182,212,0.1); color: rgb(8,145,178); border: 1px solid rgba(6,182,212,0.3);';
    } else if (normalizedLevel === 'intermedio') {
        levelBorderClass = 'course-card-level-intermedio';
        levelBadgeStyle = 'background-color: rgba(168,85,247,0.1); color: rgb(126,34,206); border: 1px solid rgba(168,85,247,0.3);';
    } else if (normalizedLevel === 'avanzado') {
        levelBorderClass = 'course-card-level-avanzado';
        levelBadgeStyle = 'background-color: rgba(245,158,11,0.1); color: rgb(180,83,9); border: 1px solid rgba(245,158,11,0.3);';
    }

    let infoButton = '';
    if (courseLink && courseLink !== '#' && courseLink !== '') {
        infoButton = `<button onclick="event.stopPropagation(); registerViewAndGo('${courseLink}', '${courseId}', '_self')" class="w-full btn-metal-blue py-3 text-[10px] uppercase flex items-center justify-center gap-2"><i class="fas fa-info-circle"></i> Info del ${courseType.toLowerCase() === 'manual' ? 'Manual' : 'Curso'}</button>`;
    } else {
        infoButton = `<button onclick="event.stopPropagation(); showNotif('Próximamente', 'Este curso estará disponible pronto.', 'info')" class="w-full bg-slate-300 text-slate-500 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-not-allowed text-center shadow-sm">PRÓXIMAMENTE</button>`;
    }

    let overlayHTML = '';
    if (showOverlay) {
        overlayHTML = `<div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
            <div class="text-center p-4">
                <i class="fas fa-lock text-4xl text-amber-400/80 mb-2"></i>
                <p class="text-white text-xs font-bold uppercase tracking-wider">Acceso Restringido</p>
                <p class="text-white/60 text-[10px] mt-1">${overlayText}</p>
            </div>
        </div>`;
    }

    // Sistema de valoración con estrellas
    let ratingStarsHTML = '';
    if (isLogged) {
        ratingStarsHTML = `
            <div class="flex items-center gap-2 mt-4">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tu valoración:</span>
                <div class="flex gap-0.5">
                    ${[1,2,3,4,5].map(star => `
                        <i class="fas fa-star cursor-pointer text-sm ${userRating >= star ? 'text-yellow-400' : 'text-slate-300'}" 
                           onclick="event.stopPropagation(); rateCourse('${courseId}', ${star})" 
                           title="${star} estrella${star>1?'s':''}"></i>
                    `).join('')}
                </div>
            </div>`;
    } else {
        ratingStarsHTML = `
            <div class="mt-4">
                <button onclick="event.stopPropagation(); openModal('authModal')" 
                        class="text-[10px] font-bold text-slate-500 hover:text-[#2db8ce] transition-colors flex items-center gap-1">
                    <i class="fas fa-star text-yellow-400"></i> Inicia sesión para valorar
                </button>
            </div>`;
    }

    return `
    <div class="course-card ${levelBorderClass} ${estadoClase} reveal reveal-up">
        <div class="aspect-video w-full overflow-hidden bg-[#0f172a] relative">
            <img src="${courseImage}" alt="${courseName}" class="w-full h-full object-cover ${isAccessGranted ? 'opacity-100' : 'opacity-30'}" loading="lazy" onerror="this.src='https://placehold.co/600x400/1e293b/2db8ce?text=Curso'">
            <div class="absolute top-3 left-3 flex flex-col gap-1.5">
                <span class="px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${courseType.toLowerCase() === 'manual' ? 'bg-blue-600/90 text-white border border-blue-400/60 shadow-lg shadow-blue-500/20' : 'bg-slate-900/70 text-white'}">${courseType}</span>
                ${courseCategory ? `<span class="px-2.5 py-1 text-[9px] font-black uppercase rounded-md bg-slate-900/70 text-white">${courseCategory}</span>` : ''}
                ${badgesHTML}
            </div>
            <div class="absolute top-3 right-3 bg-slate-900/70 text-[#2db8ce] text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1">
                <i class="fas fa-star text-yellow-400"></i> ${avgRating}
            </div>
            <div class="absolute top-3 right-3 mt-6">
                ${badgeEstadoHTML}
            </div>
            <div class="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                <div class="flex items-center justify-center ${normalizedLevel === 'basico' || normalizedLevel === 'básico' ? 'bg-cyan-500/10 border-cyan-500/30' : normalizedLevel === 'intermedio' ? 'bg-purple-500/10 border-purple-500/30' : normalizedLevel === 'avanzado' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-500/10 border-slate-500/30'} backdrop-blur-sm rounded-full w-10 h-10 shadow-lg border-2" title="${courseLevel}">
                    <i class="fas ${normalizedLevel === 'basico' || normalizedLevel === 'básico' ? 'fa-seedling text-cyan-400' : normalizedLevel === 'intermedio' ? 'fa-cogs text-purple-400' : normalizedLevel === 'avanzado' ? 'fa-rocket text-amber-400' : 'fa-layer-group text-slate-400'} text-lg"></i>
                </div>
                ${courseType.toLowerCase() === 'manual' ? `
                <div class="flex items-center justify-center bg-blue-500/10 border-2 border-blue-500/30 backdrop-blur-sm rounded-full w-10 h-10 shadow-lg" title="Manual">
                    <i class="fas fa-book-open text-lg text-blue-400"></i>
                </div>` : ''}
            </div>
            ${overlayHTML}
        </div>
        <div class="p-5 md:p-6 flex-grow flex flex-col">
            ${profesorNombre || profesorFoto ? `
            <div class="professor-block flex items-center gap-3 mb-4 rounded-xl p-2 -mt-1" style="cursor: default;">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border-2 border-cyan-500/50 shadow-md flex-shrink-0">
                    ${profesorFoto ? `<img src="${profesorFoto}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(profesorNombre || 'P')}&background=06b6d4&color=fff'">` : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">${(profesorNombre || 'P').charAt(0).toUpperCase()}</div>`}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="professor-label text-[9px] font-bold uppercase" style="color: #64748b;">Profesor</p>
                    <p class="professor-name text-sm font-bold" style="color: #1e293b;">${profesorNombre || 'Por asignar'}</p>
                    ${profesorEspecialidad ? `<p class="professor-specialty text-[10px]" style="color: #475569;">${profesorEspecialidad}</p>` : ''}
                </div>
                ${profesorEspecialidad ? `<i class="fas fa-badge-check text-cyan-500 text-xs" title="Especialista certificado"></i>` : ''}
            </div>` : ''}
            
            <h2 class="text-lg font-bold text-slate-900 mb-3">${courseName}</h2>
            
            <div class="flex items-center justify-between mb-4 text-xs font-bold">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded-md flex items-center gap-1" style="${levelBadgeStyle}"><i class="fas fa-book-open w-3 h-3"></i> ${courseLevel}</span>
                    <span class="bg-green-50 text-green-600 border border-green-100 px-2 py-1 rounded-md"><i class="fas fa-users w-3 h-3"></i> ${displayCount}</span>
                </div>
                <div class="flex items-center gap-3">
                    <button class="like-btn flex items-center gap-1 ${isLikedClass}" data-id="curso-${courseId}" onclick="event.stopPropagation(); toggleLike(this)">
                        <i class="fas fa-heart"></i><span class="like-count">${likes}</span>
                    </button>
                    <span class="flex items-center gap-1 ${viewsClass}"><i class="fas fa-eye"></i><span class="view-count" data-id="curso-${courseId}">${vistas}</span></span>
                </div>
            </div>
            
            ${courseDescription ? `<p class="text-slate-500 text-sm mb-4">${courseDescription}</p>` : ''}
            
            ${ratingStarsHTML}
            
            <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                ${priceTag}
                ${botonHTML}
            </div>
            ${mensajeEstado}
        </div>
        <div class="px-5 md:px-6 py-4 bg-slate-50 border-t border-slate-100" onclick="event.stopPropagation();">
            ${infoButton}
        </div>
    </div>`;
}

// ==========================================
// FUNCIONES DE COMPRA DESDE LA HOME (MISMO MODAL QUE CATÁLOGO)
// ==========================================
function abrirModalCompraFromHome(courseId) {
    if (!currentUser) {
        showNotif('Acceso requerido', 'Debes iniciar sesión para comprar un curso.', 'info');
        return;
    }
    
    const curso = catalogoCursos.find(c => String(c.ID || c.id || '') === String(courseId));
    if (!curso) {
        console.error('Curso no encontrado:', courseId);
        showNotif('Error', 'Curso no encontrado.', 'error');
        return;
    }
    
    const email = currentUser.email.toLowerCase();
    const cursoNombre = curso.Nombre || curso.nombre || '';
    const key = email + '|' + cursoNombre;
    const acceso = dbUserAccessStatus[key] || 'NO';
    
    if (acceso === 'SÍ' || acceso === 'SI') {
        showNotif('Ya inscrito', 'Ya estás inscrito en este curso.', 'info');
        return;
    }
    
    cursoSeleccionadoHome = curso;
    cursoPrecioUSDHome = parseFloat(curso.Precio || curso.precio || 0);
    tasaBCVHome = tasaBCVGlobal || 49.50;
    
    document.getElementById('modalCursoTituloHome').textContent = cursoNombre;
    document.getElementById('modalCursoDescripcionHome').textContent = curso.Descripcion || curso.descripcion || 'Curso de automatización industrial';
    document.getElementById('modalCursoPrecioHome').textContent = `${curso.Moneda || curso.moneda || '$'} ${cursoPrecioUSDHome.toFixed(2)}`;
    
    document.getElementById('mensajeCompraHome').classList.add('hidden');
    document.getElementById('mensajeCompraHome').textContent = '';
    document.getElementById('btnConfirmarCompraHome').disabled = false;
    document.getElementById('btnConfirmarCompraHome').innerHTML = '<i class="fas fa-shopping-cart"></i> Confirmar';
    document.getElementById('btnConfirmarCompraHome').className = 'btn-comprar flex-1 text-center flex items-center justify-center gap-2 text-xs md:text-sm py-2.5 md:py-3';
    
    const tasaContainer = document.getElementById('tasaBCVContainerHome');
    tasaContainer.classList.add('hidden');
    tasaContainer.style.display = 'none';
    
    setTimeout(() => { obtenerTasaBCVHome(); }, 300);
    openModal('modalCompra');
}

function cerrarModalCompraHome() {
    closeModal('modalCompra');
    cursoSeleccionadoHome = null;
    document.getElementById('tasaBCVContainerHome').classList.add('hidden');
    document.getElementById('tasaBCVContainerHome').style.display = 'none';
}

async function obtenerTasaBCVHome() {
    try {
        const container = document.getElementById('tasaBCVContainerHome');
        const tasaValor = document.getElementById('tasaBCVNumeroHome');
        const tasaActualizado = document.getElementById('tasaBCVActualizadoHome');
        const totalBs = document.getElementById('totalBsHome');
        const montoBs = document.getElementById('montoEnBsHome');
        
        tasaValor.textContent = '...';
        totalBs.textContent = 'Bs. ...';
        if (montoBs) montoBs.textContent = 'Bs. ...';
        
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await response.json();
        
        if (data && data.promedio) {
            tasaBCVHome = data.promedio;
            tasaBCVGlobal = data.promedio;
            
            const fecha = data.fechaActualizacion ? new Date(data.fechaActualizacion) : new Date();
            const fechaStr = fecha.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            tasaValor.textContent = tasaBCVHome.toFixed(2);
            tasaActualizado.textContent = fechaStr;
            
            const total = cursoPrecioUSDHome * tasaBCVHome;
            totalBs.innerHTML = `<img src="${VENEZUELA_FLAG_URL}" alt="🇻🇪" style="width:18px;height:13px;object-fit:cover;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:4px;box-shadow:0 1px 2px rgba(0,0,0,0.2);"> Bs. ${total.toFixed(2)}`;
            if (montoBs) montoBs.innerHTML = `<img src="${VENEZUELA_FLAG_URL}" alt="🇻🇪" style="width:14px;height:10px;object-fit:cover;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:3px;box-shadow:0 1px 2px rgba(0,0,0,0.2);"> Bs. ${total.toFixed(2)}`;
            
            container.classList.remove('hidden');
            container.style.display = 'block';
        } else {
            throw new Error('No se pudo obtener la tasa');
        }
    } catch (error) {
        console.error('Error al obtener tasa BCV:', error);
        tasaBCVHome = 49.50;
        tasaBCVGlobal = 49.50;
        document.getElementById('tasaBCVNumeroHome').textContent = '49.50';
        document.getElementById('tasaBCVActualizadoHome').textContent = 'Estimado (fallback)';
        
        const total = cursoPrecioUSDHome * tasaBCVHome;
        document.getElementById('totalBsHome').innerHTML = `<img src="${VENEZUELA_FLAG_URL}" alt="🇻🇪" style="width:18px;height:13px;object-fit:cover;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:4px;box-shadow:0 1px 2px rgba(0,0,0,0.2);"> Bs. ${total.toFixed(2)}`;
        document.getElementById('montoEnBsHome').innerHTML = `<img src="${VENEZUELA_FLAG_URL}" alt="🇻🇪" style="width:14px;height:10px;object-fit:cover;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:3px;box-shadow:0 1px 2px rgba(0,0,0,0.2);"> Bs. ${total.toFixed(2)}`;
        
        document.getElementById('tasaBCVContainerHome').classList.remove('hidden');
        document.getElementById('tasaBCVContainerHome').style.display = 'block';
    }
}

function verTasaBCVHome() {
    const container = document.getElementById('tasaBCVContainerHome');
    if (container.classList.contains('hidden')) {
        obtenerTasaBCVHome();
    } else {
        container.classList.toggle('hidden');
        container.style.display = container.classList.contains('hidden') ? 'none' : 'block';
    }
}

function enviarWhatsAppHome() {
    if (!cursoSeleccionadoHome || !currentUser) {
        showNotif('Error', 'No hay curso seleccionado o usuario no identificado.', 'error');
        return;
    }
    const nombreUsuario = currentUser.name || currentUser.email || 'Usuario';
    const nombreCurso = cursoSeleccionadoHome.Nombre || cursoSeleccionadoHome.nombre || 'Curso';
    const montoTotal = cursoPrecioUSDHome * tasaBCVHome;
    const mensaje = `Saludos, mi nombre es ${nombreUsuario}, les comparto la captura por la compra del curso "${nombreCurso}" por Bs. ${montoTotal.toFixed(2)} (Tasa BCV: Bs. ${tasaBCVHome.toFixed(2)}), espero confirmación.`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    const url = `https://wa.me/584121414196?text=${mensajeCodificado}`;
    window.open(url, '_blank');
}

async function confirmarCompraHome() {
    if (!cursoSeleccionadoHome || !currentUser) return;
    
    const btn = document.getElementById('btnConfirmarCompraHome');
    const mensaje = document.getElementById('mensajeCompraHome');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    mensaje.classList.add('hidden');
    
    try {
        const cursoNombre = cursoSeleccionadoHome.Nombre || cursoSeleccionadoHome.nombre || '';
        const formData = new URLSearchParams();
        formData.append('action', 'register_course_with_payment');
        formData.append('courseName', cursoNombre);
        formData.append('name', currentUser.name || '');
        formData.append('email', currentUser.email);
        formData.append('cedula', currentUser.cedula || '');
        formData.append('telefono', currentUser.telefono || '');
        formData.append('pais', currentUser.pais || '');
        formData.append('estado', currentUser.estado || '');
        formData.append('estadoPago', 'Pendiente');
        formData.append('accesoHabilitado', 'NO');
        
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.status === 'success') {
            mensaje.classList.remove('hidden');
            mensaje.className = 'mt-3 text-center text-sm text-green-400';
            mensaje.innerHTML = `
                <i class="fas fa-check-circle"></i> 
                ¡Inscripción registrada!<br>
                <span class="text-amber-400">⏳ El curso está pendiente de verificación de pago.</span><br>
                <span class="text-slate-400 text-xs">Aparecerá en "Mis Cursos" cuando sea verificado.</span>
            `;
            btn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
            btn.className = 'bg-green-500 text-white px-6 py-3 rounded-xl font-semibold flex-1 text-center';
            
            const key = currentUser.email.toLowerCase() + '|' + cursoNombre;
            dbUserPaymentStatus[key] = 'Pendiente';
            
            setTimeout(() => {
                cerrarModalCompraHome();
                loadData();
                rJFExu5NouR7CUdQrUbMPjxysaRauzYP5b();
                showNotif('✅ Compra registrada', 'El curso está pendiente de verificación de pago.', 'success');
            }, 2000);
        } else {
            mensaje.classList.remove('hidden');
            mensaje.className = 'mt-3 text-center text-sm text-red-400';
            mensaje.textContent = '❌ ' + (result.message || 'Error al inscribirse. Intenta nuevamente.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Confirmar';
        }
    } catch (error) {
        console.error('Error en compra:', error);
        mensaje.classList.remove('hidden');
        mensaje.className = 'mt-3 text-center text-sm text-red-400';
        mensaje.textContent = '❌ Error de conexión. Intenta nuevamente.';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Confirmar';
    }
}

// ==========================================
// INSCRIPCIÓN GRATUITA DESDE LA HOME
// ==========================================
async function enrollFreeCourseFromHome(courseId, courseName) {
    if (!currentUser || !currentUser.email) {
        showNotif('Acceso requerido', 'Debes iniciar sesión para inscribirte.', 'info');
        return;
    }
    
    const email = currentUser.email.toLowerCase();
    const key = email + '|' + courseName;
    const acceso = dbUserAccessStatus[key] || 'NO';
    
    if (acceso === 'SÍ' || acceso === 'SI') {
        showNotif('Ya inscrito', 'Ya te encuentras inscrito en este curso.', 'info');
        return;
    }
    
    showLoadingToast();
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'register_course_with_payment');
        formData.append('courseName', courseName);
        formData.append('name', currentUser.name || email.split('@')[0]);
        formData.append('email', email);
        formData.append('cedula', currentUser.cedula || '');
        formData.append('telefono', currentUser.telefono || '');
        formData.append('pais', currentUser.pais || '');
        formData.append('estado', currentUser.estado || '');
        formData.append('estadoPago', 'Verificado');
        formData.append('accesoHabilitado', 'SI');
        
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.status === 'success') {
            if (!currentUser.accessedCursos) currentUser.accessedCursos = [];
            if (!currentUser.accessedCursos.includes(parseInt(courseId))) {
                currentUser.accessedCursos.push(parseInt(courseId));
            }
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            dbUserPaymentStatus[key] = 'Verificado';
            dbUserAccessStatus[key] = 'SÍ';
            
            await loadData();
            rJFExu5NouR7CUdQrUbMPjxysaRauzYP5b();
            
            showSuccessToast();
            showNotif('✅ Inscripción exitosa', `Te has inscrito en "${courseName}"`, 'success');
        } else {
            hideLoadingToast();
            showNotif('Error', result.message || 'No se pudo completar la inscripción.', 'error');
        }
    } catch (e) {
        hideLoadingToast();
        console.error('Error en inscripción gratuita:', e);
        showNotif('Error de conexión', 'Intenta de nuevo.', 'error');
    }
}

// ==========================================
// EXPANSIÓN DE TARJETAS DE METODOLOGÍA
// ==========================================
let methodologyClone = null;
let methodologyOriginal = null;

function initMethodologyCards() {
    const cards = document.querySelectorAll('.methodology-card');
    if (!cards.length) {
        console.warn('⚠️ No se encontraron tarjetas de metodología');
        return;
    }

    let overlay = document.querySelector('.card-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        document.body.appendChild(overlay);
    }

    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (methodologyClone) return;
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
    methodologyOriginal = card;
    methodologyClone = card.cloneNode(true);

    methodologyClone.style.position = 'fixed';
    methodologyClone.style.top = rect.top + 'px';
    methodologyClone.style.left = rect.left + 'px';
    methodologyClone.style.width = rect.width + 'px';
    methodologyClone.style.height = rect.height + 'px';
    methodologyClone.style.margin = '0';
    methodologyClone.style.zIndex = '100011';
    methodologyClone.style.transition = 'all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)';
    methodologyClone.classList.remove('reveal', 'reveal-up', 'delay-100', 'delay-200', 'delay-300');

    card.style.visibility = 'hidden';
    document.body.appendChild(methodologyClone);
    overlay.classList.add('visible');
    void methodologyClone.offsetWidth;

    requestAnimationFrame(() => {
        methodologyClone.classList.add('is-expanded');
    });
}

function closeExpandedMethodologyCard() {
    if (!methodologyClone) return;
    const overlay = document.querySelector('.card-overlay');
    methodologyClone.classList.remove('is-expanded');
    if (overlay) overlay.classList.remove('visible');

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
// MOSTRAR TODAS LAS SECCIONES
// ==========================================
function revealAllSections() {
    document.querySelectorAll('.section-loading').forEach(el => {
        el.classList.add('loaded');
    });
    setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }, 100);
}

function revealMetrics() {
    const metrics = document.getElementById('metrics');
    if (metrics) {
        metrics.classList.remove('section-loading');
        metrics.classList.add('metrics-loading');
        void metrics.offsetWidth;
        metrics.classList.add('loaded');
    }
}

// ==========================================
// FUNCIONES AUXILIARES PARA BADGES
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
// RENDERIZAR HOME (SIN CURSOS DESTACADOS)
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
    
    
    

    

    
    // ==========================================
    // MODALIDADES - COMENTADO PORQUE YA ESTÁ EN EL HTML
    // ==========================================
    /*
    if (homePageData.modalidades.length > 0) {
        const container = document.querySelector('#modalidades .grid');
        if (container) {
            container.innerHTML = homePageData.modalidades.map((modalidad, index) => {
                // ... código ...
            }).join('');
        }
    }
    */
    
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
                            <i class="fas fa-box text-[#2db8ce] text-sm mt-1"></i>
                            <div>
                                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">IMPORTANTE:</span>
                                <p class="text-white text-xs font-bold">${participantes}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    
    // ==========================================
    // METODOLOGÍA - COMENTADO PORQUE YA ESTÁ EN EL HTML
    // ==========================================
    /*
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
    */
    
    
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
    if (toast) { 
        toast.classList.remove('hidden', 'hiding', 'success-toast'); 
        toast.style.opacity = '1'; 
        const title = document.getElementById('loadingToastTitle');
        if (title) title.innerText = 'Estamos cargando la información';
    }
}
function showSuccessToast() {
    const toast = document.getElementById('loadingToast');
    if (toast) { 
        toast.classList.remove('hidden', 'hiding'); 
        toast.classList.add('success-toast'); 
        const title = document.getElementById('loadingToastTitle');
        if (title) title.innerText = '¡Listo!';
        setTimeout(() => hideLoadingToast(), 3000); 
    }
}
function hideLoadingToast() {
    const toast = document.getElementById('loadingToast');
    if (toast) { 
        toast.classList.add('hiding'); 
        setTimeout(() => toast.classList.add('hidden'), 500); 
    }
}
function showNotif(title, msg, type = 'success') {
    const notification = document.getElementById('notification');
    if (notification) {
        const notifTitle = document.getElementById('notifTitle');
        const notifMsg = document.getElementById('notifMsg');
        const notifIcon = document.getElementById('notifIcon');
        if (notifTitle) notifTitle.innerText = title;
        if (notifMsg) notifMsg.innerText = msg;
        if (notifIcon) {
            notifIcon.className = type === 'success' ? 'fas fa-check-circle text-2xl' : 
                               type === 'error' ? 'fas fa-times-circle text-2xl' : 
                               'fas fa-info-circle text-2xl';
        }
        notification.style.transform = 'translateX(0)';
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
        }, 4000);
    }
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

    const [pageLoaded, statsLoaded, catalogoLoaded] = await Promise.all([
        loadHomePageData(),
        loadData(false),
        loadCatalogoCursos()
    ]);

    await obtenerTasaBCVGlobal();

    renderHomePage();
    rJFExu5NouR7CUdQrUbMPjxysaRauzYP5b();
    
    // Inicializar metodología con un pequeño retraso para asegurar que las tarjetas estén en el DOM
    setTimeout(() => {
        initMethodologyCards();
    }, 300);

    revealAllSections();
    hideLoadingToast();

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
            if (likeBtn) likeBtn.classList.add('liked', 'text-red-500');
        });
    }
    document.querySelectorAll('.prof-btn').forEach(b => { b.disabled = false; b.style.opacity = '1'; });

    setTimeout(() => loadGoogleCharts(), 1500);

    console.log('✅ Inicialización completada');
});