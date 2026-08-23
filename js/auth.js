/**
 * LÓGICA DE AUTENTICACIÓN (AuthLogic)
 * Maneja el estado del usuario comunicándose con Google Apps Script y usando localStorage.
 * Adaptado para el sistema completo de Aprende Automatización (Integración con Mis Cursos/Progreso).
 * 
 * VERSIÓN ACTUALIZADA: Registro extendido con Cédula, Teléfono, Estado, Profesión y validación de contraseña.
 */
const AuthLogic = {
    currentUser: null,
    pendingAction: null,

    // Usar SCRIPT_URL global si existe (de mis cursos), o el valor por defecto
    API_URL: window.SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzNk3MlpXGcrLEMYgB-2rX2CdvldAEJ9p1MoZOIshtcUunf31Xuq4mvWDCGXAFaAkFC/exec',

    // Inicializar: Revisar si hay sesión guardada en localStorage
    init: async function() {
        // Utilizamos 'user' como clave para compatibilidad con la app de Mis Cursos
        const savedSession = localStorage.getItem('user') || localStorage.getItem('aa_user_session');
        if (savedSession) {
            try {
                this.currentUser = JSON.parse(savedSession);
                window.currentUser = this.currentUser; // Sincronizar con la variable global de la página
                console.log("AuthLogic.init: currentUser loaded from localStorage", this.currentUser);

                // Al iniciar, refresca los datos del usuario desde el servidor para obtener los últimos cambios (ej. cursos inscritos).
                await this.refreshSessionData();
            } catch (e) {
                console.error("Error al leer sesión", e);
            }
        }

        AuthUI.injectModal();
        AuthUI.updateGlobalState();
    },

    // Utilidad para normalizar nombres de cursos (usado para emparejar cursos de la DB)
    normalizeName: function(s) {
        return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    },

    refreshSessionData: async function() {
        if (!this.currentUser || !this.currentUser.email) return;

        try {
            const email = this.currentUser.email.toLowerCase();

            const response = await fetch(`${this.API_URL}?action=get_data&nocache=${Date.now()}`);
            const data = await response.json();

            if(data.status === 'success') {
                let globalUser = data.users ? data.users[email] : null;
                let details = data.userDetails ? data.userDetails[email] : {};

                if (typeof globalUser === 'string') {
                    try { globalUser = JSON.parse(globalUser); } catch(err) { globalUser = {}; }
                }
                globalUser = globalUser || {};

                const originalUserJSON = JSON.stringify(this.currentUser);

                // Consolidar fechas de culminación de todas las fuentes
                const serverCompletionDates = (data.userCourseCompletionDates && data.userCourseCompletionDates[email]) ? data.userCourseCompletionDates[email] : {};
                const globalUserCompletionDates = (globalUser.completionDates && typeof globalUser.completionDates === 'object') ? globalUser.completionDates : {};
                const localCompletionDates = this.currentUser.completionDates || {};
                // El orden importa: la data más fresca (del servidor) sobreescribe la local.
                const mergedCompletionDates = {...localCompletionDates, ...globalUserCompletionDates, ...serverCompletionDates};

                // Consolidar fechas de inscripción
                const serverEnrollmentDates = (data.userCourseEnrollmentDates && data.userCourseEnrollmentDates[email]) ? data.userCourseEnrollmentDates[email] : {};
                const localEnrollmentDates = this.currentUser.enrollmentDates || {};
                const mergedEnrollmentDates = {...localEnrollmentDates, ...serverEnrollmentDates};

                // Reconstruimos el objeto de usuario, similar a handleLogin, pero preservando la contraseña local
                const refreshedUser = {
                    name: (details.name && details.name !== "No provisto" && details.name !== "N/A") ? details.name : (globalUser.name || email.split('@')[0]),
                    email: email,
                    password: this.currentUser.password, // Preservar contraseña de la sesión actual
                    profession: globalUser.profession || this.currentUser.profession || "",
                    likedCourses: Array.isArray(globalUser.likedCourses) ? globalUser.likedCourses : (this.currentUser.likedCourses || []),
                    accessedCursos: Array.isArray(this.currentUser.accessedCursos) ? [...this.currentUser.accessedCursos] : [], // Empezar con los cursos locales
                    downloadedFiles: Array.isArray(globalUser.downloadedFiles) ? globalUser.downloadedFiles : (this.currentUser.downloadedFiles || []),
                    downloadCounts: (globalUser.downloadCounts && typeof globalUser.downloadCounts === 'object') ? globalUser.downloadCounts : (this.currentUser.downloadCounts || {}),
                    ratings: globalUser.ratings || this.currentUser.ratings || {},
                    completionDates: mergedCompletionDates,
                    enrollmentDates: mergedEnrollmentDates,
                    cedula: details.cedula || this.currentUser.cedula || "N/A",
                    telefono: details.telefono || this.currentUser.telefono || "N/A",
                    pais: details.pais || this.currentUser.pais || "N/A",
                    estado: details.estado || this.currentUser.estado || "N/A",
                    visitRegistro: globalUser.visitRegistro || this.currentUser.visitRegistro || { cursos: {}, infoPaginas: {}, aulas: {}, materiales: {} }
                };

                // Sincronizar cursos adquiridos desde la hoja 'userCourses' del backend
                if (data.userCourses && data.userCourses[email] && typeof window.COURSES_DATA !== 'undefined') {
                    let myCourseNamesRaw = data.userCourses[email] || [];
                    let myCourseNames = [];
                    if (Array.isArray(myCourseNamesRaw)) { myCourseNamesRaw.forEach(v => { if(typeof v === 'string') myCourseNames.push(...v.split(/[,;\n]+/).map(s=>s.trim()).filter(s=>s!=="")); else if(v) myCourseNames.push(v); }); } 
                    else if (typeof myCourseNamesRaw === 'string') { myCourseNames.push(...myCourseNamesRaw.split(/[,;\n]+/).map(s=>s.trim()).filter(s=>s!=="")); }

                    myCourseNames.forEach(cName => {
                        let nn = AuthLogic.normalizeName(cName);
                        let found = window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.Nombre) === nn) || window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.Nombre).includes(nn) || nn.includes(AuthLogic.normalizeName(x.Nombre)));
                        if(found && !refreshedUser.accessedCursos.includes(found.ID)) { refreshedUser.accessedCursos.push(found.ID); }
                    });
                }

                if (JSON.stringify(refreshedUser) !== originalUserJSON) {
                    this.currentUser = refreshedUser;
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                    window.currentUser = this.currentUser;
                    console.log("AuthLogic: Datos de sesión actualizados desde el servidor.");
                    AuthUI.updateGlobalState();
                }
            }
        } catch (error) { console.error("Error al refrescar los datos de sesión:", error); }
    },

    handleLogin: async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const pass = document.getElementById('login-pass').value.trim();

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        if(email && pass.length >= 6) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            btn.disabled = true;

            try {
                const response = await fetch(`${this.API_URL}?action=get_data&nocache=${Date.now()}`);
                const data = await response.json();

                if(data.status === 'success') {
                    // Datos del backend
                    let globalUser = data.users ? data.users[email] : null;
                    let details = data.userDetails ? data.userDetails[email] : {};

                    // A veces Google Sheets devuelve un JSON stringificado dentro de la celda
                    if (typeof globalUser === 'string') {
                        try { globalUser = JSON.parse(globalUser); } catch(err) { globalUser = {}; }
                    }
                    globalUser = globalUser || {};

                    const hasGlobal = Object.keys(globalUser).length > 0;
                    const hasDetails = details.name && details.name !== "No provisto" && details.name !== "N/A";

                    if (!hasGlobal && !hasDetails) {
                        this.showNotification('El correo ingresado no se encuentra registrado', 'error');
                        return;
                    }

                    if (hasGlobal && globalUser.password && String(globalUser.password) !== String(pass)) {
                        this.showNotification('Contraseña incorrecta', 'error');
                        return;
                    }

                    // Consolidar fechas de culminación
                    const serverCompletionDates = (data.userCourseCompletionDates && data.userCourseCompletionDates[email]) ? data.userCourseCompletionDates[email] : {};
                    const globalUserCompletionDates = (globalUser.completionDates && typeof globalUser.completionDates === 'object') ? globalUser.completionDates : {};
                    const mergedCompletionDates = {...globalUserCompletionDates, ...serverCompletionDates};

                    // Construimos el objeto maestro compatible con "Mis Cursos"
                    this.currentUser = {
                        name: (details.name && details.name !== "No provisto" && details.name !== "N/A") ? details.name : (globalUser.name || email.split('@')[0]),
                        email: email,
                        password: pass,
                        profession: globalUser.profession || "",
                        likedCourses: Array.isArray(globalUser.likedCourses) ? globalUser.likedCourses : [],
                        accessedCursos: Array.isArray(globalUser.accessedCursos) ? globalUser.accessedCursos : [],
                        downloadedFiles: Array.isArray(globalUser.downloadedFiles) ? globalUser.downloadedFiles : [],
                        downloadCounts: (globalUser.downloadCounts && typeof globalUser.downloadCounts === 'object') ? globalUser.downloadCounts : {},
                        ratings: globalUser.ratings || {},
                        completionDates: mergedCompletionDates,
                        cedula: details.cedula || "N/A",
                        telefono: details.telefono || "N/A",
                        pais: details.pais || "N/A",
                        estado: details.estado || "N/A",
                        visitRegistro: globalUser.visitRegistro || { cursos: {}, infoPaginas: {}, aulas: {}, materiales: {} }
                    };

                    // Sincronizar cursos adquiridos si COURSES_DATA existe (ej. en la página de Mis Cursos)
                    if (data.userCourses && data.userCourses[email] && typeof window.COURSES_DATA !== 'undefined') {
                        let myCourseNamesRaw = data.userCourses[email] || [];
                        let myCourseNames = [];

                        if (Array.isArray(myCourseNamesRaw)) {
                            myCourseNamesRaw.forEach(v => {
                                if(typeof v === 'string') myCourseNames.push(...v.split(/[,;\n]+/).map(s=>s.trim()).filter(s=>s!==""));
                                else if(v) myCourseNames.push(v);
                            });
                        } else if (typeof myCourseNamesRaw === 'string') {
                            myCourseNames.push(...myCourseNamesRaw.split(/[,;\n]+/).map(s=>s.trim()).filter(s=>s!==""));
                        }

                        myCourseNames.forEach(cName => {
                            let nn = AuthLogic.normalizeName(cName);
                            let found = window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.Nombre) === nn);
                            if(!found) found = window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.Nombre).includes(nn) || nn.includes(AuthLogic.normalizeName(x.Nombre)));

                            if(found && !this.currentUser.accessedCursos.includes(found.ID)) {
                                this.currentUser.accessedCursos.push(found.ID);
                            }
                        });
                    }

                    // Guardar sesión principal
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                    window.currentUser = this.currentUser; // <--- CLAVE: Actualiza la variable global instantáneamente

                    this.showNotification(`¡Bienvenido de nuevo, ${this.currentUser.name}!`, 'success');
                    AuthUI.closeModal();
                    AuthUI.updateGlobalState();

                    if(this.pendingAction) {
                        this.pendingAction();
                        this.pendingAction = null;
                    }

                    // Forzar recarga de la página para asegurar que todos los estados se actualicen
                    setTimeout(() => window.location.reload(), 700);
                } else {
                    this.showNotification('Error al obtener datos del servidor', 'error');
                }
            } catch (error) {
                console.error("Error en login remoto:", error);
                this.showNotification('Error conectando al servidor. Inténtalo de nuevo más tarde.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } else {
            this.showNotification('Por favor ingresa un correo válido y contraseña (min. 6)', 'error');
        }
    },

    // ==============================
    // REGISTRO EXTENDIDO - ACTUALIZADO
    // ==============================
    handleRegister: async function(e) {
        e.preventDefault();

        // Capturar todos los campos del formulario de registro
        const name      = document.getElementById('reg-name').value.trim();
        const email     = document.getElementById('reg-email').value.trim().toLowerCase();
        const cedula    = document.getElementById('reg-cedula').value.trim();
        const telefono  = document.getElementById('reg-telefono').value.trim();
        const pais      = document.getElementById('reg-country').value;
        const estado    = document.getElementById('reg-estado').value.trim();
        const profession = document.getElementById('reg-profession').value;
        const pass      = document.getElementById('reg-pass').value.trim();

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        // --- VALIDACIONES ---
        if(!name || !email || !cedula || !telefono || !pais || !profession || !pass) {
            this.showNotification('Por favor completa todos los campos obligatorios.', 'error');
            return;
        }

        // Validar que si es Venezuela, el estado no esté vacío
        if(pais === 'Venezuela' && !estado) {
            this.showNotification('Debes seleccionar tu estado si eres de Venezuela.', 'error');
            return;
        }

        // Validación de contraseña: mínimo 6 caracteres, al menos 1 letra, 1 número y 1 carácter especial
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
        if(!passwordRegex.test(pass)) {
            this.showNotification('La contraseña debe tener mínimo 6 caracteres, al menos 1 letra, 1 número y 1 carácter especial.', 'error');
            return;
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        btn.disabled = true;

        try {
            const formData = new URLSearchParams();
            formData.append('action', 'register');
            formData.append('name', name);
            formData.append('email', email);
            formData.append('cedula', cedula);
            formData.append('telefono', telefono);
            formData.append('pais', pais);
            formData.append('estado', pais === 'Venezuela' ? estado : '');
            formData.append('profession', profession);
            formData.append('password', pass);

            const response = await fetch(this.API_URL, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if(data.status === 'success') {
                // Creando el usuario maestro para consistencia
                this.currentUser = { 
                    name: name, 
                    email: email, 
                    password: pass,
                    cedula: cedula,
                    telefono: telefono,
                    pais: pais,
                    estado: pais === 'Venezuela' ? estado : '',
                    profession: profession,
                    likedCourses: [],
                    accessedCursos: [],
                    downloadedFiles: [],
                    ratings: {},
                    completionDates: {},
                    enrollmentDates: {},
                    visitRegistro: { cursos: {}, infoPaginas: {}, aulas: {}, materiales: {} }
                };

                localStorage.setItem('user', JSON.stringify(this.currentUser));
                window.currentUser = this.currentUser; // <--- CLAVE: Sincroniza la variable global

                this.showNotification(`¡Cuenta creada exitosamente! Hola, ${name}`, 'success');
                AuthUI.closeModal();
                AuthUI.updateGlobalState();

                if(this.pendingAction) {
                    this.pendingAction();
                    this.pendingAction = null;
                }
                // Forzar recarga para refrescar todo el estado de la UI
                setTimeout(() => window.location.reload(), 700);
            } else {
                this.showNotification(data.message || 'Error: El correo ya existe o hubo un fallo', 'error');
            }
        } catch (error) {
            console.error("Error en registro remoto:", error);
            this.showNotification('Error conectando al servidor.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    logout: function() {
        this.currentUser = null;
        window.currentUser = null; // Limpiar la variable global
        localStorage.removeItem('user');
        localStorage.removeItem('aa_user_session'); // Por si quedó una sesión antigua
        this.pendingAction = null;

        this.showNotification('Has cerrado sesión exitosamente', 'info');

        // Forzar recarga para refrescar todo el estado de la UI de forma consistente
        setTimeout(() => window.location.reload(), 700);
    },

    /**
     * Registra una visita en visitRegistro y sincroniza con el servidor
     */
    recordVisit: function(type, id, details = {}) {
        if (!this.currentUser) return;

        if (!this.currentUser.visitRegistro) {
            this.currentUser.visitRegistro = { cursos: {}, infoPaginas: {}, aulas: {}, materiales: {} };
        }

        const timestamp = new Date().toISOString();
        const entry = { lastVisit: timestamp, ...details };

        switch(type) {
            case 'aula':
                this.currentUser.visitRegistro.aulas[id] = entry;
                break;
            case 'info':
                this.currentUser.visitRegistro.infoPaginas[id] = entry;
                break;
            case 'material':
                this.currentUser.visitRegistro.materiales[id] = entry;
                break;
            case 'curso':
                this.currentUser.visitRegistro.cursos[id] = entry;
                break;
            default:
                console.warn('[AuthLogic] Tipo de visita desconocido:', type);
                return;
        }

        localStorage.setItem('user', JSON.stringify(this.currentUser));
        window.currentUser = this.currentUser;
        this.syncUserData(true); // true = silencioso, sin spinner

        console.log(`[AuthLogic] Visita registrada: ${type} | ${id}`);
    },

    syncUserData: async function(silent = false) {
        if (!this.currentUser || !this.currentUser.email) return;

        if (!silent && typeof window.showSyncIndicator === 'function') {
            window.showSyncIndicator('Sincronizando...', 'loading');
        }

        const email = this.currentUser.email.toLowerCase();
        const userData = JSON.stringify(this.currentUser);

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({action: 'update_user', email: email, userData: userData})
            });

            if (response.ok || response.type === 'opaque' || response.redirected) {
                 if (!silent && typeof window.showSyncIndicator === 'function') {
                    window.showSyncIndicator('Progreso guardado en la nube', 'success');
                }
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (e) {
            console.error('Sync error:', e);
            if (!silent) {
                this.showNotification('Error de sincronización', 'No se pudo guardar tu progreso en la nube.', 'error');
                if (typeof window.showSyncIndicator === 'function') {
                    window.showSyncIndicator('Error de sincronización', 'error');
                }
            }
        }
    },

    showNotification: function(title, message, type = 'info') {
        if (typeof showNotif === 'function') {
            showNotif(title, message, type);
        } else if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(message, type);
        } else {
            alert(title + ": " + message);
        }
    }
};

/**
 * INTERFAZ DE USUARIO DE AUTENTICACIÓN (AuthUI)
 */
const AuthUI = {
    injectModal: function() {
        if (document.getElementById('auth-modal')) return;

        const modalHTML = `
        <div id="auth-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100000] hidden flex items-center justify-center transition-opacity opacity-0" style="transition: opacity 0.3s ease;">
            <div class="bg-slate-800 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all relative" style="max-height: 90vh; overflow-y: auto;">

                <button onclick="AuthUI.closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white transition bg-slate-700/50 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center z-10">
                    <i class="fas fa-times"></i>
                </button>

                <div class="flex border-b border-white/5 bg-slate-900/50 sticky top-0 z-10">
                    <button id="tab-login" onclick="AuthUI.switchTab('login')" class="flex-1 py-4 text-center font-bold text-cyan-400 border-b-2 border-cyan-400 transition uppercase tracking-wider text-xs">Ingresar</button>
                    <button id="tab-register" onclick="AuthUI.switchTab('register')" class="flex-1 py-4 text-center font-bold text-slate-500 hover:text-slate-300 transition uppercase tracking-wider text-xs border-b-2 border-transparent">Crear Cuenta</button>
                </div>

                <div class="p-8">
                    <!-- FORMULARIO DE LOGIN (sin cambios) -->
                    <form id="form-login" onsubmit="AuthLogic.handleLogin(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Correo Electrónico</label>
                            <div class="relative">
                                <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="email" id="login-email" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" placeholder="tu@correo.com">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Contraseña</label>
                            <div class="relative">
                                <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="password" id="login-pass" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition" placeholder="••••••••">
                            </div>
                        </div>
                        <button type="submit" class="w-full bg-gradient-to-r from-cyan-600 to-teal-500 text-white py-3 rounded-xl font-black uppercase tracking-widest hover:from-cyan-500 hover:to-teal-400 transition shadow-lg shadow-cyan-500/20 mt-6 flex items-center justify-center gap-2">
                            <i class="fas fa-sign-in-alt"></i> Acceder
                        </button>
                    </form>

                    <!-- FORMULARIO DE REGISTRO (EXTENDIDO) -->
                    <form id="form-register" onsubmit="AuthLogic.handleRegister(event)" class="space-y-4 hidden">

                        <!-- Nombre Completo -->
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Nombre Completo <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="text" id="reg-name" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Tu nombre completo">
                            </div>
                        </div>

                        <!-- Correo Electrónico -->
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Correo Electrónico <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="email" id="reg-email" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="tu@correo.com">
                            </div>
                        </div>

                        <!-- Cédula / ID -->
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Cédula / ID <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="text" id="reg-cedula" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Ej: V-12345678">
                            </div>
                        </div>

                        <!-- Teléfono -->
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Teléfono <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="tel" id="reg-telefono" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Ej: +58 412-1234567">
                            </div>
                        </div>

                        <!-- País -->
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">País <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <select id="reg-country" required onchange="AuthUI.handleCountryChange(this.value)" class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none">
                                    <option value="" disabled selected>Selecciona tu país...</option>
                                    <option value="Venezuela">Venezuela</option>
                                    <option value="Colombia">Colombia</option>
                                    <option value="México">México</option>
                                    <option value="Argentina">Argentina</option>
                                    <option value="Perú">Perú</option>
                                    <option value="Chile">Chile</option>
                                    <option value="Ecuador">Ecuador</option>
                                    <option value="España">España</option>
                                    <option value="Estados Unidos">Estados Unidos</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- Estado (solo Venezuela) -->
                        <div id="reg-estado-container" class="hidden">
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Estado <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <select id="reg-estado" class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none">
                                    <option value="" disabled selected>Selecciona tu estado...</option>
                                    <option value="Amazonas">Amazonas</option>
                                    <option value="Anzoátegui">Anzoátegui</option>
                                    <option value="Apure">Apure</option>
                                    <option value="Aragua">Aragua</option>
                                    <option value="Barinas">Barinas</option>
                                    <option value="Bolívar">Bolívar</option>
                                    <option value="Carabobo">Carabobo</option>
                                    <option value="Cojedes">Cojedes</option>
                                    <option value="Delta Amacuro">Delta Amacuro</option>
                                    <option value="Distrito Capital">Distrito Capital</option>
                                    <option value="Falcón">Falcón</option>
                                    <option value="Guárico">Guárico</option>
                                    <option value="Lara">Lara</option>
                                    <option value="Mérida">Mérida</option>
                                    <option value="Miranda">Miranda</option>
                                    <option value="Monagas">Monagas</option>
                                    <option value="Nueva Esparta">Nueva Esparta</option>
                                    <option value="Portuguesa">Portuguesa</option>
                                    <option value="Sucre">Sucre</option>
                                    <option value="Táchira">Táchira</option>
                                    <option value="Trujillo">Trujillo</option>
                                    <option value="Vargas">Vargas</option>
                                    <option value="Yaracuy">Yaracuy</option>
                                    <option value="Zulia">Zulia</option>
                                </select>
                                <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- Profesión -->
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Profesión <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <select id="reg-profession" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none">
                                    <option value="" disabled selected>Selecciona tu profesión...</option>
                                    <option value="Ingeniero">Ingeniero</option>
                                    <option value="TSU">TSU</option>
                                    <option value="Estudiante Universitario">Estudiante Universitario</option>
                                    <option value="Bachiller o Técnico Medio">Bachiller o Técnico Medio</option>
                                    <option value="INCES">INCES</option>
                                </select>
                                <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <!-- Contraseña con requisitos de seguridad -->
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Contraseña <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="password" id="reg-pass" required 
                                    oninput="AuthUI.validatePasswordRealtime(this.value)"
                                    class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" 
                                    placeholder="Mín. 6 caracteres, 1 letra, 1 número, 1 especial">
                            </div>
                            <!-- Indicadores de requisitos de contraseña -->
                            <div id="password-requirements" class="mt-2 space-y-1 text-[10px] text-slate-500">
                                <div id="req-length" class="flex items-center gap-2"><i class="fas fa-circle text-[6px]"></i> Mínimo 6 caracteres</div>
                                <div id="req-letter" class="flex items-center gap-2"><i class="fas fa-circle text-[6px]"></i> Al menos 1 letra</div>
                                <div id="req-number" class="flex items-center gap-2"><i class="fas fa-circle text-[6px]"></i> Al menos 1 número</div>
                                <div id="req-special" class="flex items-center gap-2"><i class="fas fa-circle text-[6px]"></i> Al menos 1 carácter especial (!@#$%^&*)</div>
                            </div>
                        </div>

                        <button type="submit" class="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-black uppercase tracking-widest hover:from-teal-400 hover:to-cyan-500 transition shadow-lg shadow-teal-500/20 mt-6 flex items-center justify-center gap-2">
                            <i class="fas fa-user-plus"></i> Crear Cuenta
                        </button>
                    </form>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Mostrar/ocultar campo de estado según país seleccionado
    handleCountryChange: function(country) {
        const estadoContainer = document.getElementById('reg-estado-container');
        const estadoSelect = document.getElementById('reg-estado');

        if (country === 'Venezuela') {
            estadoContainer.classList.remove('hidden');
            estadoSelect.setAttribute('required', 'required');
        } else {
            estadoContainer.classList.add('hidden');
            estadoSelect.removeAttribute('required');
            estadoSelect.value = '';
        }
    },

    // Validación en tiempo real de la contraseña
    validatePasswordRealtime: function(value) {
        const reqLength = document.getElementById('req-length');
        const reqLetter = document.getElementById('req-letter');
        const reqNumber = document.getElementById('req-number');
        const reqSpecial = document.getElementById('req-special');

        const setValid = (el, isValid) => {
            if (isValid) {
                el.classList.remove('text-slate-500');
                el.classList.add('text-emerald-400');
                el.querySelector('i').className = 'fas fa-check text-[8px]';
            } else {
                el.classList.remove('text-emerald-400');
                el.classList.add('text-slate-500');
                el.querySelector('i').className = 'fas fa-circle text-[6px]';
            }
        };

        setValid(reqLength, value.length >= 6);
        setValid(reqLetter, /[A-Za-z]/.test(value));
        setValid(reqNumber, /\d/.test(value));
        setValid(reqSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value));
    },

    openModal: function(tab = 'login') {
        const modal = document.getElementById('auth-modal');
        if(modal) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
            this.switchTab(tab);
        }
    },

    closeModal: function() {
        const modal = document.getElementById('auth-modal');
        if(modal) {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                document.getElementById('form-login').reset();
                document.getElementById('form-register').reset();
                // Resetear validaciones de contraseña
                this.validatePasswordRealtime('');
                // Ocultar estado si quedó visible
                const estadoContainer = document.getElementById('reg-estado-container');
                if(estadoContainer) estadoContainer.classList.add('hidden');
                AuthLogic.pendingAction = null;
            }, 300);
        }
    },

    switchTab: function(tab) {
        const btnLogin = document.getElementById('tab-login');
        const btnReg = document.getElementById('tab-register');
        const formLogin = document.getElementById('form-login');
        const formReg = document.getElementById('form-register');

        const activeClass = "flex-1 py-4 text-center font-bold text-cyan-400 border-b-2 border-cyan-400 transition uppercase tracking-wider text-xs";
        const inactiveClass = "flex-1 py-4 text-center font-bold text-slate-500 hover:text-slate-300 transition uppercase tracking-wider text-xs border-b-2 border-transparent";

        if (tab === 'login') {
            btnLogin.className = activeClass;
            btnReg.className = inactiveClass;
            formLogin.classList.remove('hidden');
            formReg.classList.add('hidden');
        } else {
            btnReg.className = activeClass;
            btnLogin.className = inactiveClass;
            formReg.classList.remove('hidden');
            formLogin.classList.add('hidden');
        }
    },

    requireAuth: function(callback) {
        if (AuthLogic.currentUser) {
            callback();
        } else {
            AuthLogic.pendingAction = callback;
            this.openModal('login');
            AuthLogic.showNotification('Acceso Restringido', 'Debes iniciar sesión para realizar esta acción', 'info');
        }
    },

    updateGlobalState: function() {
        const isLogged = AuthLogic.currentUser !== null;

        // Actualizar el botón principal de acceso de la Landing (si existe)
        const authMainBtn = document.getElementById('authMainBtn');
        const authBtnText = document.getElementById('authBtnText');

        if (authMainBtn && authBtnText) {
            if (isLogged) {
                authBtnText.innerText = `Hola, ${AuthLogic.currentUser.name}`;
                authMainBtn.classList.add('bg-[#2db8ce]/20', 'border-[#2db8ce]/50');
                authMainBtn.classList.remove('bg-white/10', 'border-white/20');
                authMainBtn.querySelector('i').classList.remove('fa-user');
                authMainBtn.querySelector('i').classList.add('fa-user-check');
            } else {
                authBtnText.innerText = "Ingresar";
                authMainBtn.classList.remove('bg-[#2db8ce]/20', 'border-[#2db8ce]/50');
                authMainBtn.classList.add('bg-white/10', 'border-white/20');
                authMainBtn.querySelector('i').classList.remove('fa-user-check');
                authMainBtn.querySelector('i').classList.add('fa-user');
            }
        }

        // Utilidades de ocultar/mostrar elementos
        document.querySelectorAll('.auth-protected-content').forEach(el => { el.style.display = isLogged ? 'block' : 'none'; });
        document.querySelectorAll('.auth-required-message').forEach(el => { el.style.display = isLogged ? 'none' : 'block'; });
    }
};

window.handleNavbarAuthClick = function(e) {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    if (AuthLogic.currentUser) {
        window.logoutUser();
    } else {
        AuthUI.openModal('login');
    }
};

// Sobrescribir las funciones del HTML para que usen nuestro modal global
window.openModal = function(id) {
    if(id === 'authModal') {
        AuthUI.openModal('login');
    } else {
        const modal = document.getElementById(id);
        if(modal) modal.classList.add('active');
    }
};

window.logoutUser = function() {
    if (confirm("¿Deseas cerrar sesión?")) {
        AuthLogic.logout();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AuthLogic.init();
});

// ==========================================
// AUTO-TRACKING DE VISITAS
// Detecta automáticamente el tipo de página según la URL
// y registra la visita sin tocar cada HTML individual
// ==========================================
(function setupAutoTracking() {

    function detectAndTrack() {
        // Solo si hay usuario logueado
        if (typeof AuthLogic === 'undefined' || !AuthLogic.currentUser) {
            console.log('[AutoTrack] Sin sesión activa, no se registra visita.');
            return;
        }

        const url = window.location.href.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);

        // --- DETECTAR ID DEL CURSO ---
        let courseId = 'general';

        // 1. Buscar en parámetros URL comunes
        const paramNames = ['id', 'curso', 'course', 'courseid', 'aula', 'cursoid'];
        for (const param of paramNames) {
            const val = urlParams.get(param);
            if (val) { courseId = val; break; }
        }

        // 2. Si no hay param, intentar extraer del path (ej: /aula-plc-basico.html)
        if (courseId === 'general') {
            const pathMatch = path.match(/(?:aula|curso|info|material)[-_]?([^\/\?\.]+)/);
            if (pathMatch && pathMatch[1]) courseId = pathMatch[1];
        }

        // 3. Si aún no hay, usar el título de la página sanitizado
        if (courseId === 'general' && document.title) {
            courseId = document.title.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 50);
        }

        // --- DETECTAR TIPO DE PÁGINA ---
        let type = null;
        const details = { 
            url: window.location.href, 
            title: document.title || 'Sin título',
            path: path
        };

        // AULA VIRTUAL: URL contiene "aula" o el body tiene "aula virtual"
        if (
            url.includes('aula') || 
            path.includes('aula') || 
            document.body.innerText.toLowerCase().includes('aula virtual')
        ) {
            type = 'aula';
        }
        // MATERIALES / MANUALES / DESCARGAS
        else if (
            url.includes('material') || 
            url.includes('manual') || 
            url.includes('descarga') || 
            url.includes('recurso') || 
            path.includes('materiales')
        ) {
            type = 'material';
        }
        // INFO DE CURSO: tiene parámetro de curso y no es home
        else if (
            courseId !== 'general' && 
            !url.includes('index') && 
            !url.includes('home') &&
            (url.includes('info') || url.includes('curso') || url.includes('detalle') || url.includes('detalles'))
        ) {
            type = 'info';
        }
        // PÁGINA MIS CURSOS (dashboard)
        else if (
            url.includes('mis-cursos') || 
            url.includes('mycourses') || 
            url.includes('micuenta')
        ) {
            type = 'curso';
            courseId = 'dashboard';
        }

        // --- REGISTRAR ---
        if (type) {
            AuthLogic.recordVisit(type, courseId, details);
            console.log(`[AutoTrack] ✅ ${type.toUpperCase()} registrado | ID: ${courseId}`);
        } else {
            console.log('[AutoTrack] ℹ️ Página no clasificada para tracking:', path);
        }
    }

    // Ejecutar cuando el DOM y AuthLogic estén listos
    function initTracking() {
        // Esperar un momento a que AuthLogic.init() termine
        setTimeout(detectAndTrack, 1200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }

})();