/**
 * LÓGICA DE AUTENTICACIÓN (AuthLogic)
 * Maneja el estado del usuario comunicándose con Google Apps Script y usando localStorage.
 * Adaptado para el sistema completo de Aprende Automatización (Integración con Mis Cursos/Progreso).
 */
const AuthLogic = {
    currentUser: null,
    pendingAction: null,

    // Usar SCRIPT_URL global si existe (de mis cursos), o el valor por defecto
    API_URL: window.SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxk8EW1EvIi0WjIOJ6iQYX6nF735XMvDUKgcgsvaKcgKZYiHnyeYTPTO-NSl3BXewm8/exec',

    // Inicializar: Revisar si hay sesión guardada en localStorage
    init: function() {
        // Utilizamos 'user' como clave para compatibilidad con la app de Mis Cursos
        const savedSession = localStorage.getItem('user') || localStorage.getItem('aa_user_session');
        if (savedSession) {
            try {
                this.currentUser = JSON.parse(savedSession);
                window.currentUser = this.currentUser; // Sincronizar con la variable global de la página
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

                    // Construimos el objeto maestro compatible con "Mis Cursos"
                    this.currentUser = {
                        name: (details.name && details.name !== "No provisto" && details.name !== "N/A") ? details.name : (globalUser.name || email.split('@')[0]),
                        email: email,
                        password: pass,
                        profession: globalUser.profession || "",
                        likedCourses: Array.isArray(globalUser.likedCourses) ? globalUser.likedCourses : [],
                        accessedCursos: Array.isArray(globalUser.accessedCursos) ? globalUser.accessedCursos : [],
                        downloadedFiles: Array.isArray(globalUser.downloadedFiles) ? globalUser.downloadedFiles : [],
                        ratings: globalUser.ratings || {},
                        cedula: details.cedula || "N/A",
                        telefono: details.telefono || "N/A",
                        pais: details.pais || "N/A",
                        estado: details.estado || "N/A"
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
                            let found = window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.name) === nn);
                            if(!found) found = window.COURSES_DATA.find(x => AuthLogic.normalizeName(x.name).includes(nn) || nn.includes(AuthLogic.normalizeName(x.name)));
                            
                            if(found && !this.currentUser.accessedCursos.includes(found.id)) {
                                this.currentUser.accessedCursos.push(found.id);
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

    handleRegister: async function(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const pass = document.getElementById('reg-pass').value.trim();
        const country = document.getElementById('reg-country').value;
        
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        if(name && email && pass.length >= 6 && country) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
            btn.disabled = true;

            try {
                const formData = new URLSearchParams();
                formData.append('action', 'register');
                formData.append('name', name);
                formData.append('email', email);
                formData.append('password', pass);
                formData.append('pais', country);

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
                        profession: "",
                        likedCourses: [],
                        accessedCursos: [],
                        downloadedFiles: [],
                        ratings: {},
                        cedula: "",
                        telefono: "",
                        pais: country,
                        estado: ""
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
        } else {
            this.showNotification('Por favor completa todos los campos (país incluido, contraseña de 6+ caracteres)', 'error');
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
            <div class="bg-slate-800 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all relative">
                
                <button onclick="AuthUI.closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white transition bg-slate-700/50 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>

                <div class="flex border-b border-white/5 bg-slate-900/50">
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
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Nombre Completo</label>
                            <div class="relative">
                                <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="text" id="reg-name" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="Tu Nombre">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Correo Electrónico</label>
                            <div class="relative">
                                <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="email" id="reg-email" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="tu@correo.com">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">País</label>
                            <div class="relative">
                                <i class="fas fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <select id="reg-country" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none">
                                    <option value="" disabled selected>Selecciona tu país...</option>
                                    <option value="Venezuela">Venezuela</option><option value="Colombia">Colombia</option><option value="México">México</option><option value="Argentina">Argentina</option><option value="Perú">Perú</option><option value="Chile">Chile</option><option value="Ecuador">Ecuador</option><option value="España">España</option><option value="Estados Unidos">Estados Unidos</option><option value="Otro">Otro</option>
                                </select>
                                <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Contraseña</label>
                            <div class="relative">
                                <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="password" id="reg-pass" required class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" placeholder="••••••••">
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