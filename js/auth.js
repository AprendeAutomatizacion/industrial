/**
 * LÓGICA DE AUTENTICACIÓN (AuthLogic)
 * Maneja el estado del usuario comunicándose con Google Apps Script y usando localStorage.
 * Adaptado para el sistema completo de Aprende Automatización (Integración con Mis Cursos/Progreso).
 * 
 * ✅ SEPARACIÓN DE DESCARGAS:
 *    - archivosDescargados (Columna K) → Aula Virtual
 *    - downloadedFiles (Columna N) → Página de Programas
 */
const AuthLogic = {
    currentUser: null,
    pendingAction: null,

    API_URL: window.SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzvSa9yxQYuWtC-YSn4x1K6hzhdeujQfNEb1GoWkvJmFShA4kdhSWe_oOoBFqkKaagx/exec',

    init: async function() {
        const savedSession = localStorage.getItem('user') || localStorage.getItem('aa_user_session');
        if (savedSession) {
            try {
                this.currentUser = JSON.parse(savedSession);
                window.currentUser = this.currentUser;
                console.log("AuthLogic.init: currentUser loaded from localStorage", this.currentUser);
                await this.refreshSessionData();
            } catch (e) {
                console.error("Error al leer sesión", e);
            }
        }
        AuthUI.injectModal();
        AuthUI.updateGlobalState();
    },

    normalizeName: function(s) {
        return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    },

    // ============================================================
    // ✅ REFRESH SESSION - Carga archivosDescargados y downloadedFiles
    // ============================================================
    refreshSessionData: async function() {
        if (!this.currentUser || !this.currentUser.email) return;

        try {
            const email = this.currentUser.email.toLowerCase();
            const response = await fetch(`${this.API_URL}?action=get_user&email=${encodeURIComponent(email)}&nocache=${Date.now()}`);
            const data = await response.json();

            if(data.status === 'success') {
                let globalUser = data.user || null;
                let details = data.userDetails || {};

                if (!globalUser) return;

                const originalUserJSON = JSON.stringify(this.currentUser);

                // Consolidar fechas
                const serverCompletionDates = (data.userCourseCompletionDates && typeof data.userCourseCompletionDates === 'object') ? data.userCourseCompletionDates : {};
                const globalUserCompletionDates = (globalUser.completionDates && typeof globalUser.completionDates === 'object') ? globalUser.completionDates : {};
                const localCompletionDates = this.currentUser.completionDates || {};
                const mergedCompletionDates = {...localCompletionDates, ...globalUserCompletionDates, ...serverCompletionDates};

                const serverEnrollmentDates = (data.userCourseEnrollmentDates && typeof data.userCourseEnrollmentDates === 'object') ? data.userCourseEnrollmentDates : {};
                const localEnrollmentDates = this.currentUser.enrollmentDates || {};
                const mergedEnrollmentDates = {...localEnrollmentDates, ...serverEnrollmentDates};

                // ✅ archivosDescargados (Columna K) → Aula Virtual
                let archivosDescargados = {};
                if (globalUser.archivosDescargados) {
                    if (typeof globalUser.archivosDescargados === 'string') {
                        try { archivosDescargados = JSON.parse(globalUser.archivosDescargados); } catch(e) { archivosDescargados = {}; }
                    } else if (typeof globalUser.archivosDescargados === 'object' && !Array.isArray(globalUser.archivosDescargados)) {
                        archivosDescargados = globalUser.archivosDescargados;
                    }
                }
                if (Array.isArray(archivosDescargados)) archivosDescargados = {};

                // ✅ downloadedFiles (Columna N) → Página de Programas
                let downloadedFiles = {};
                if (globalUser.downloadedFiles) {
                    if (typeof globalUser.downloadedFiles === 'string') {
                        try { downloadedFiles = JSON.parse(globalUser.downloadedFiles); } catch(e) { downloadedFiles = {}; }
                    } else if (typeof globalUser.downloadedFiles === 'object' && !Array.isArray(globalUser.downloadedFiles)) {
                        downloadedFiles = globalUser.downloadedFiles;
                    }
                }
                if (Array.isArray(downloadedFiles)) downloadedFiles = {};

                // Si hay historial_descargas, combinarlo con archivosDescargados
                if (globalUser.historial_descargas) {
                    if (typeof globalUser.historial_descargas === 'string') {
                        try {
                            const parsed = JSON.parse(globalUser.historial_descargas);
                            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                                archivosDescargados = { ...parsed, ...archivosDescargados };
                            }
                        } catch(e) {}
                    }
                }

                const refreshedUser = {
                    name: (details.name && details.name !== "No provisto" && details.name !== "N/A") ? details.name : (globalUser.name || email.split('@')[0]),
                    email: email,
                    password: this.currentUser.password,
                    profession: globalUser.profession || this.currentUser.profession || "",
                    likedCourses: Array.isArray(globalUser.likedCourses) ? globalUser.likedCourses : (this.currentUser.likedCourses || []),
                    accessedCursos: Array.isArray(this.currentUser.accessedCursos) ? [...this.currentUser.accessedCursos] : [],
                    archivosDescargados: archivosDescargados,
                    downloadedFiles: downloadedFiles,
                    ratings: globalUser.ratings || this.currentUser.ratings || {},
                    completionDates: mergedCompletionDates,
                    enrollmentDates: mergedEnrollmentDates,
                    cedula: details.cedula || this.currentUser.cedula || "N/A",
                    telefono: details.telefono || this.currentUser.telefono || "N/A",
                    pais: details.pais || this.currentUser.pais || "N/A",
                    estado: details.estado || this.currentUser.estado || "N/A"
                };

                // Sincronizar cursos adquiridos
                if (data.userCourses && typeof window.COURSES_DATA !== 'undefined') {
                    let myCourseNames = data.userCourses || [];
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
                    console.log("AuthLogic: Datos actualizados. archivosDescargados:", this.currentUser.archivosDescargados);
                    AuthUI.updateGlobalState();
                }
            }
        } catch (error) { 
            console.error("Error al refrescar los datos de sesión:", error); 
        }
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
                const response = await fetch(`${this.API_URL}?action=get_user&email=${encodeURIComponent(email)}&nocache=${Date.now()}`);
                const text = await response.text();
                let data;
                try { data = JSON.parse(text); } catch (e) { throw new Error('Respuesta del servidor no válida'); }

                if(data.status === 'success') {
                    let globalUser = data.user || null;
                    let details = data.userDetails || {};

                    if (!globalUser) {
                        this.showNotification('El correo ingresado no se encuentra registrado', 'error');
                        return;
                    }

                    if (globalUser.password && String(globalUser.password) !== String(pass)) {
                        this.showNotification('Contraseña incorrecta', 'error');
                        return;
                    }

                    const serverCompletionDates = (data.userCourseCompletionDates && typeof data.userCourseCompletionDates === 'object') ? data.userCourseCompletionDates : {};
                    const mergedCompletionDates = {...(globalUser.completionDates || {}), ...serverCompletionDates};

                    // ✅ archivosDescargados (Columna K)
                    let archivosDescargados = {};
                    if (globalUser.archivosDescargados) {
                        if (typeof globalUser.archivosDescargados === 'string') {
                            try { archivosDescargados = JSON.parse(globalUser.archivosDescargados); } catch(e) { archivosDescargados = {}; }
                        } else if (typeof globalUser.archivosDescargados === 'object' && !Array.isArray(globalUser.archivosDescargados)) {
                            archivosDescargados = globalUser.archivosDescargados;
                        }
                    }
                    if (Array.isArray(archivosDescargados)) archivosDescargados = {};

                    // ✅ downloadedFiles (Columna N)
                    let downloadedFiles = {};
                    if (globalUser.downloadedFiles) {
                        if (typeof globalUser.downloadedFiles === 'string') {
                            try { downloadedFiles = JSON.parse(globalUser.downloadedFiles); } catch(e) { downloadedFiles = {}; }
                        } else if (typeof globalUser.downloadedFiles === 'object' && !Array.isArray(globalUser.downloadedFiles)) {
                            downloadedFiles = globalUser.downloadedFiles;
                        }
                    }
                    if (Array.isArray(downloadedFiles)) downloadedFiles = {};

                    // Si hay historial_descargas, combinarlo con archivosDescargados
                    if (globalUser.historial_descargas) {
                        if (typeof globalUser.historial_descargas === 'string') {
                            try {
                                const parsed = JSON.parse(globalUser.historial_descargas);
                                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                                    archivosDescargados = { ...parsed, ...archivosDescargados };
                                }
                            } catch(e) {}
                        }
                    }

                    this.currentUser = {
                        name: (details.name && details.name !== "No provisto" && details.name !== "N/A") ? details.name : (globalUser.name || email.split('@')[0]),
                        email: email,
                        password: pass,
                        profession: globalUser.profession || "",
                        likedCourses: Array.isArray(globalUser.likedCourses) ? globalUser.likedCourses : [],
                        accessedCursos: Array.isArray(globalUser.accessedCursos) ? globalUser.accessedCursos : [],
                        archivosDescargados: archivosDescargados,
                        downloadedFiles: downloadedFiles,
                        ratings: globalUser.ratings || {},
                        completionDates: mergedCompletionDates,
                        cedula: details.cedula || globalUser.cedula || "N/A",
                        telefono: details.telefono || globalUser.telefono || "N/A",
                        pais: details.pais || globalUser.pais || "N/A",
                        estado: details.estado || globalUser.estado || "N/A"
                    };

                    if (data.userCourses && typeof window.COURSES_DATA !== 'undefined') {
                        let myCourseNames = data.userCourses || [];
                        myCourseNames.forEach(cName => {
                            let nn = AuthLogic.normalizeName(cName);
                            let found = window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.Nombre) === nn);
                            if(!found) found = window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.Nombre).includes(nn) || nn.includes(AuthLogic.normalizeName(x.Nombre)));
                            if(found && !this.currentUser.accessedCursos.includes(found.ID)) {
                                this.currentUser.accessedCursos.push(found.ID);
                            }
                        });
                    }

                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                    window.currentUser = this.currentUser;

                    this.showNotification(`¡Bienvenido de nuevo, ${this.currentUser.name}!`, 'success');
                    AuthUI.closeModal();
                    AuthUI.updateGlobalState();

                    if(this.pendingAction) {
                        this.pendingAction();
                        this.pendingAction = null;
                    }

                    setTimeout(() => window.location.reload(), 700);
                } else {
                    this.showNotification(data.message || 'Error al obtener datos del servidor', 'error');
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

    handleRegister: async function(e) {
        e.preventDefault();

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

        if(!name || !email || !cedula || !telefono || !pais || !profession || !pass) {
            this.showNotification('Por favor completa todos los campos obligatorios.', 'error');
            return;
        }

        if(pais === 'Venezuela' && !estado) {
            this.showNotification('Debes seleccionar tu estado si eres de Venezuela.', 'error');
            return;
        }

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

            const response = await fetch(this.API_URL, { method: 'POST', body: formData });
            const data = await response.json();

            if(data.status === 'success') {
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
                    archivosDescargados: {},
                    downloadedFiles: {},
                    ratings: {},
                    completionDates: {},
                    enrollmentDates: {}
                };

                localStorage.setItem('user', JSON.stringify(this.currentUser));
                window.currentUser = this.currentUser;

                this.showNotification(`¡Cuenta creada exitosamente! Hola, ${name}`, 'success');
                AuthUI.closeModal();
                AuthUI.updateGlobalState();

                if(this.pendingAction) {
                    this.pendingAction();
                    this.pendingAction = null;
                }
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
        window.currentUser = null;
        localStorage.removeItem('user');
        localStorage.removeItem('aa_user_session');
        this.pendingAction = null;
        this.showNotification('Has cerrado sesión exitosamente', 'info');
        setTimeout(() => window.location.reload(), 700);
    },

    // ============================================================
    // ✅ SYNC USER DATA - Guarda archivosDescargados (K) y downloadedFiles (N) por separado
    // ============================================================
    syncUserData: async function(silent = false) {
        if (!this.currentUser || !this.currentUser.email) return;

        if (!silent && typeof window.showSyncIndicator === 'function') {
            window.showSyncIndicator('Sincronizando...', 'loading');
        }

        // ✅ Asegurar que ambos sean objetos JSON válidos
        if (!this.currentUser.archivosDescargados || Array.isArray(this.currentUser.archivosDescargados)) {
            this.currentUser.archivosDescargados = {};
        }
        if (!this.currentUser.downloadedFiles || Array.isArray(this.currentUser.downloadedFiles)) {
            this.currentUser.downloadedFiles = {};
        }

        // ✅ ELIMINAR campos duplicados/legado
        const userToSync = { ...this.currentUser };
        delete userToSync.downloadCounts;
        delete userToSync.downloadedPrograms;

        const email = this.currentUser.email.toLowerCase();
        const userData = JSON.stringify(userToSync);

        // ✅ Enviar cada campo de descarga por separado para que el backend sepa dónde ponerlo
        const params = new URLSearchParams({
            action: 'update_user', 
            email: email, 
            userData: userData,
            archivosDescargados: JSON.stringify(this.currentUser.archivosDescargados),
            downloadedFiles: JSON.stringify(this.currentUser.downloadedFiles)
        });

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            if (response.ok || response.type === 'opaque' || response.redirected) {
                if (!silent && typeof window.showSyncIndicator === 'function') {
                    window.showSyncIndicator('Progreso guardado en la nube', 'success');
                }
                console.log('✅ Datos sincronizados: archivosDescargados (K)=', this.currentUser.archivosDescargados, '| downloadedFiles (N)=', this.currentUser.downloadedFiles);
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

// ============================================================
// INTERFAZ DE USUARIO DE AUTENTICACIÓN (AuthUI)
// ============================================================
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
                    <form id="form-register" onsubmit="AuthLogic.handleRegister(event)" class="space-y-4 hidden">
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Nombre Completo <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="text" id="reg-name" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Tu nombre completo">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Correo Electrónico <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="email" id="reg-email" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="tu@correo.com">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Cédula / ID <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="text" id="reg-cedula" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Ej: V-12345678">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Teléfono <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="tel" id="reg-telefono" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Ej: +58 412-1234567">
                            </div>
                        </div>
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
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Contraseña <span class="text-red-400">*</span></label>
                            <div class="relative">
                                <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="password" id="reg-pass" required oninput="AuthUI.validatePasswordRealtime(this.value)" class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Mín. 6 caracteres, 1 letra, 1 número, 1 especial">
                            </div>
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
                this.validatePasswordRealtime('');
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