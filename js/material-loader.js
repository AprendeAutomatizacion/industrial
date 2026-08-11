document.addEventListener('DOMContentLoaded', () => {
    // URL de tu Web App de Google Apps Script - ¡Pega tu URL aquí!
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJmsHsZvfWimAbW41TS5phTAO6UcJJJjq-Wd1IrMx9Tf-ANqxiuKfocD3cHt87tZH4KQ/exec';

    // 1. OBTENER EL ID DEL CURSO DESDE LA URL
    // La página se debe llamar con un parámetro, ej: material-page-id.html?id=1
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id'), 10);

    if (!courseId) {
        document.body.innerHTML = '<div style="padding: 40px; text-align: center; font-family: \'Plus Jakarta Sans\', sans-serif; color: #1e293b;"><h1>Error: ID de curso no especificado.</h1><p>Por favor, accede a esta página con una URL como: <code>material-page-id.html?id=1</code></p></div>';
        console.error("ID de curso no encontrado en la URL.");
        return;
    }

    // Función para convertir enlaces de Google Drive a descarga directa
    function getDirectDownloadUrl(url) {
        if (typeof url !== 'string' || !url.includes('drive.google.com')) {
            return url;
        }
        const regex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
        const match = url.match(regex);
        if (match && match[1]) {
            const fileId = match[1];
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return url;
    }

    // 2. CARGAR DATOS DESDE GOOGLE SHEETS
    // Volvemos a usar el método GET. Es más simple y puede evitar problemas de redirección
    // en Google Apps Script que a veces afectan a las peticiones POST.
    fetch(`${SCRIPT_URL}?action=get_course_materials&id=${courseId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la red al contactar el script: ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.status !== 'success') {
                throw new Error(result.message || 'El script de Google devolvió un error.');
            }

            const courseData = result.data.course;
            const courseMaterials = result.data.materials;

            if (!courseData) {
                throw new Error(`Curso con ID ${courseId} no encontrado en la hoja de cálculo.`);
            }

            // 3. RENDERIZAR LA PÁGINA CON LOS DATOS
            renderHeader(courseData);
            renderMaterialCards(courseMaterials);
            initializeResourceCards(); // Activar interactividad de tarjetas

            // Inicializar Lucide Icons después de que el contenido dinámico se haya cargado
            if (window.lucide) { lucide.createIcons(); }
        })
        .catch(error => {
            console.error('Error al cargar o procesar los datos:', error);
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `<p style="color: red; font-weight: bold; text-align: center; padding: 50px;">${error.message}</p>`;
            } else {
                document.body.innerHTML = `<p style="color: red; font-weight: bold; text-align: center; padding: 50px;">${error.message}</p>`;
            }
            // Asegurarse de que el título del encabezado muestre el error si no se pudo cargar el curso
            const courseMainTitle = document.getElementById('course-main-title');
            if (courseMainTitle) courseMainTitle.textContent = "Error al cargar el curso";
            const courseDescription = document.getElementById('course-description');
            if (courseDescription) courseDescription.textContent = "No se pudo obtener la información del curso.";
        });

    // Función para renderizar el encabezado
    function renderHeader(course) {
        const header = document.getElementById('hero-section');
        if (!header) return;

        const bgImage = document.getElementById('hero-bg-image');
        if (bgImage && course.ImagenHeader) {
            bgImage.src = course.ImagenHeader;
        }

        const courseMainTitle = document.getElementById('course-main-title');
        if (courseMainTitle && course.Titulo) {
            courseMainTitle.innerHTML = course.Titulo;
        }

        const courseDescription = document.getElementById('course-description');
        if (courseDescription && course.Subtitulo) {
            courseDescription.textContent = course.Subtitulo;
        }

        // Render Badges
        const heroBadges = document.getElementById('hero-badges');
        if (heroBadges && course.Badges) {
            const badges = course.Badges.split('|').map(b => b.trim()).filter(b => b);
            heroBadges.innerHTML = badges.map(badgeText => `
                <span class="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">${badgeText}</span>
            `).join('');
        } else if (heroBadges) {
            heroBadges.innerHTML = '';
        }

        // Render Features
        const courseFeatures = document.getElementById('course-features');
        if (courseFeatures && course.Features) {
            const features = course.Features.split('|').map(f => f.trim()).filter(f => f);
            courseFeatures.innerHTML = features.map(featureText => {
                const parts = featureText.split(':');
                const icon = parts.length > 1 ? parts[0].trim() : 'fas fa-check-circle';
                const text = parts.length > 1 ? parts[1].trim() : featureText;
                return `<div class="flex items-center gap-2"><i class="${icon} text-[#2db8ce]"></i> ${text}</div>`;
            }).join('');
        } else if (courseFeatures) {
            courseFeatures.innerHTML = '';
        }
    }

    // Función para renderizar las tarjetas de materiales
    function renderMaterialCards(materials) {
        const container = document.getElementById('material-cards-container');
        if (!container) return;

        if (materials.length === 0) {
            container.innerHTML = '<p class="text-gray-600 text-center col-span-full">No hay materiales disponibles para este curso.</p>';
            return;
        }

        let cardsHTML = '';
        materials.forEach((material, index) => {
            // --- Lógica de renderizado de tarjetas (metodología de aula-virtual-id.html) ---
            
            // DEBUG: Imprime el primer objeto de material en la consola para verificar los nombres de las propiedades.
            if (index === 0) {
                console.log("DEBUG: Datos del primer material recibidos desde Google Sheets:", material);
            }

            const fileType = material.TipoArchivo;
            const badgeText = (fileType || '').trim() || 'Recurso';
            const lowerType = badgeText.toLowerCase();

            let icon = 'folder'; // Icono por defecto para tipos no reconocidos

            // Lógica de iconos basada en palabras clave, como en el aula virtual
            if (['pdf', 'powerpoint', 'word', 'manual', 'libro', 'guia', 'documento'].some(t => lowerType.includes(t))) {
                icon = 'book';
            } else if (['ejercicio', 'practica', 'zip'].some(t => lowerType.includes(t))) {
                icon = 'file-archive'; // Icono de ZIP para ejercicios
            } else if (['programa', 'software'].some(t => lowerType.includes(t))) {
                icon = 'terminal'; // Icono para programas
            } else if (['quiz', 'evaluacion', 'cuestionario', 'test'].some(t => lowerType.includes(t))) {
                icon = 'file-question';
            } else if (['video', 'clase'].some(t => lowerType.includes(t))) {
                icon = 'play-circle';
            } else if (['img', 'imagen', 'diagrama'].some(t => lowerType.includes(t))) {
                icon = 'image';
            }

            let badgeClass = 'badge-manual'; // Default: Verde para texto
            let iconCircleClass = 'icon-circle-manual'; // Default: Verde para texto

            if (['quiz', 'evaluacion', 'cuestionario', 'test'].some(t => lowerType.includes(t))) {
                badgeClass = 'badge-test';
                iconCircleClass = 'icon-circle-test';
            } else if (['programa', 'software'].some(t => lowerType.includes(t))) {
                badgeClass = 'badge-programa';
                iconCircleClass = 'icon-circle-programa';
            } else if (['ejercicio', 'practica', 'zip'].some(t => lowerType.includes(t))) {
                badgeClass = 'badge-practica';
                iconCircleClass = 'icon-circle-practica';
            }
            // --- Fin de la lógica ---

            const imageUrl = material.ImagenMaterial || 'img/default-material.gif'; // Usar una imagen por defecto si no se especifica
            const downloadLink = getDirectDownloadUrl(material.Enlace);
            const fileName = material.Titulo; // Usar el título como nombre de archivo para la descarga

            cardsHTML += `
                <a href="${downloadLink}" target="_blank" class="material-card" data-file-name="${fileName}" download="${fileName}">
                    <div class="card-image-wrapper">
                        <img src="${imageUrl}" alt="${material.Titulo}" loading="lazy">
                        <div class="card-image-overlay"></div>
                        <span class="card-badge ${badgeClass}">${badgeText}</span>
                        <div class="card-icon-circle ${iconCircleClass}">
                            <i data-lucide="${icon}" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="card-body">
                        <h4 class="card-title">${material.Titulo}</h4>
                        <p class="card-subtitle">${material.Descripcion}</p>
                    </div>
                    <div class="card-footer">
                        <span class="download-count-badge">
                            <i class="fas fa-download text-[10px]"></i>
                            <span class="file-download-count" data-file-name="${fileName}">0</span>
                        </span>
                        <span class="download-btn-text">Descargar <i data-lucide="arrow-down-circle" class="w-4 h-4"></i></span>
                    </div>
                </a>
            `;
        });

        container.innerHTML = cardsHTML;
    }

    // Función para inicializar la interactividad de las tarjetas (descargas, etc.)
    function initializeResourceCards() {
        function applyGlow(card) {
            if (card) card.classList.add('glow-manual'); // 'glow-manual' y 'glow-practica' tienen el mismo estilo
        }

        function updateCardData() {
            if (typeof AuthLogic === 'undefined' || !AuthLogic.currentUser) return;
            const currentUser = AuthLogic.currentUser;
            const downloadedFiles = currentUser.downloadedFiles || [];
            const downloadCounts = currentUser.downloadCounts || {};

            document.querySelectorAll('a.material-card[data-file-name]').forEach(card => {
                const fileName = card.dataset.fileName;
                if (fileName) {
                    if (downloadedFiles.includes(fileName)) applyGlow(card);
                    const countSpan = card.querySelector('.file-download-count');
                    if (countSpan) countSpan.innerText = downloadCounts[fileName] || 0;
                }
            });
        }

        function setupClickListeners() {
            document.querySelectorAll('a.material-card[data-file-name]').forEach(card => {
                if (card.dataset.listenerAttached) return;
                card.dataset.listenerAttached = 'true';
                card.addEventListener('click', function() {
                    const fileName = this.dataset.fileName;
                    if (!fileName || typeof AuthLogic === 'undefined' || !AuthLogic.currentUser) return;

                    const currentUser = AuthLogic.currentUser;
                    
                    if (!Array.isArray(currentUser.downloadedFiles)) currentUser.downloadedFiles = [];
                    if (!currentUser.downloadedFiles.includes(fileName)) currentUser.downloadedFiles.push(fileName);
                    
                    if (typeof currentUser.downloadCounts !== 'object') currentUser.downloadCounts = {};
                    currentUser.downloadCounts[fileName] = (currentUser.downloadCounts[fileName] || 0) + 1;
                    
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    
                    const countSpan = this.querySelector('.file-download-count');
                    if (countSpan) countSpan.innerText = currentUser.downloadCounts[fileName];
                    
                    if (typeof AuthLogic.syncUserData === 'function') AuthLogic.syncUserData(true);
                    
                    applyGlow(this);
                });
            });
        }
        updateCardData();
        setupClickListeners();
    }
});