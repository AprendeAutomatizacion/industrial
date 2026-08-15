// ==========================================
// MATERIAL LOADER - CORREGIDO CON FEATURES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJmsHsZvfWimAbW41TS5phTAO6UcJJJjq-Wd1IrMx9Tf-ANqxiuKfocD3cHt87tZH4KQ/exec';

    console.log('🚀 Iniciando material-loader.js');
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id') || urlParams.get('courseId') || '';
    
    console.log('🔍 ID del curso:', courseId);

    if (!courseId) {
        document.getElementById('course-main-title').textContent = "Error: ID de curso no especificado";
        document.getElementById('course-description').textContent = "Accede con una URL como: material-page.html?id=1";
        hideLoadingToast();
        return;
    }

    showLoadingToast();

    fetch(`${SCRIPT_URL}?id=${courseId}`)
        .then(response => response.json())
        .then(result => {
            console.log('📦 Respuesta completa:', result);
            
            if (result.status !== 'success') {
                throw new Error(result.message || 'Error del servidor');
            }

            const courseData = result.data.course;
            const materials = result.data.materials || [];

            console.log('📋 Curso data:', JSON.stringify(courseData, null, 2));
            console.log('📋 Materiales:', JSON.stringify(materials, null, 2));

            if (courseData) {
                renderHeader(courseData);
            }
            
            renderMaterialCards(materials);
            showSuccessToast();
        })
        .catch(error => {
            console.error('❌ Error:', error);
            document.getElementById('course-main-title').textContent = "Error al cargar";
            document.getElementById('course-description').textContent = error.message;
            
            const container = document.getElementById('material-cards-container');
            if (container) {
                container.innerHTML = `<p style="color: red; text-align: center; padding: 50px;">${error.message}</p>`;
            }
            
            hideLoadingToast();
        });

    function renderHeader(course) {
        console.log('🖼️ Renderizando header...');
        console.log('Keys del curso:', Object.keys(course));
        
        // Título
        const titleEl = document.getElementById('course-main-title');
        if (titleEl) {
            const titulo = course.Titulo || course.Nombre || course['Título'] || course.titulo || 'Curso';
            titleEl.textContent = titulo;
            console.log('✅ Título renderizado:', titulo);
        }

        // Descripción
        const descEl = document.getElementById('course-description');
        if (descEl) {
            const descripcion = course.Subtitulo || course.Descripcion || course['Subtítulo'] || '';
            descEl.textContent = descripcion;
            console.log('✅ Descripción renderizada:', descripcion);
        }

        // Imagen de fondo
        const bgImg = document.getElementById('hero-bg-image');
        if (bgImg) {
            const imgSrc = course.ImagenHeader || course['Imagen Header'] || course.ImagenURL || '';
            if (imgSrc && imgSrc.toString().trim() !== '') {
                bgImg.src = imgSrc;
                console.log('✅ Imagen de fondo:', imgSrc);
            }
        }

        // Badges
        const badgesEl = document.getElementById('hero-badges');
        if (badgesEl) {
            const badgesStr = course.Badges || course.Badge || '';
            console.log('🏷️ Badges string:', badgesStr);
            
            if (badgesStr && badgesStr.toString().trim() !== '') {
                const badges = badgesStr.toString().split('|').map(b => b.trim()).filter(b => b);
                console.log('🏷️ Badges array:', badges);
                
                badgesEl.innerHTML = badges.map(b => 
                    `<span class="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">${b}</span>`
                ).join('');
            } else {
                badgesEl.innerHTML = '<span class="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">Curso</span>';
            }
        }

        // ============ FEATURES - CORREGIDO ============
        const featuresEl = document.getElementById('course-features');
        if (featuresEl) {
            // Probar diferentes nombres de columna para Features
            const featuresStr = course.Features || course.features || course['Caracteristicas'] || course['Características'] || course['caracteristicas'] || '';
            
            console.log('⭐ Features string:', featuresStr);
            
            if (featuresStr && featuresStr.toString().trim() !== '') {
                // Dividir por | o por coma
                let features = [];
                if (featuresStr.toString().includes('|')) {
                    features = featuresStr.toString().split('|').map(f => f.trim()).filter(f => f);
                } else if (featuresStr.toString().includes(',')) {
                    features = featuresStr.toString().split(',').map(f => f.trim()).filter(f => f);
                } else {
                    features = [featuresStr.toString().trim()];
                }
                
                console.log('⭐ Features array:', features);
                
                featuresEl.innerHTML = features.map(featureText => {
                    // Verificar si tiene formato "icono: texto"
                    const colonIndex = featureText.indexOf(':');
                    if (colonIndex > 0) {
                        const iconPart = featureText.substring(0, colonIndex).trim();
                        const textPart = featureText.substring(colonIndex + 1).trim();
                        return `<div class="flex items-center gap-2"><i class="${iconPart} text-[#2db8ce]"></i> ${textPart}</div>`;
                    } else {
                        return `<div class="flex items-center gap-2"><i class="fas fa-check-circle text-[#2db8ce]"></i> ${featureText}</div>`;
                    }
                }).join('');
            } else {
                featuresEl.innerHTML = '';
                console.log('⚠️ No hay Features definidos');
            }
        }
    }

    function renderMaterialCards(materials) {
        const container = document.getElementById('material-cards-container');
        if (!container) return;

        console.log('🎴 Renderizando', materials.length, 'materiales');

        if (!materials || materials.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 50px; color: #64748b;">No hay materiales disponibles para este curso.</p>';
            return;
        }

        let html = '';
        
        materials.forEach((material, index) => {
            const titulo = material.Titulo || material['Título'] || material.Nombre || material.nombre || 'Material';
            const descripcion = material.Descripcion || material['Descripción'] || material.descripcion || '';
            const tipo = material.TipoArchivo || material['Tipo Archivo'] || material.Tipo || material.tipo || 'Recurso';
            const imagen = material.ImagenMaterial || material['Imagen Material'] || material.Imagen || material.imagen || 'img/AA (1).gif';
            const enlace = material.Enlace || material.enlace || material.link || material.URL || '#';
            
            const tipoLower = tipo.toLowerCase();
            let badgeClass = 'badge-manual';
            let iconClass = 'fas fa-book text-emerald-600';
            let iconCircleClass = 'icon-circle-manual';
            
            if (tipoLower.includes('practica') || tipoLower.includes('ejercicio') || tipoLower.includes('zip')) {
                badgeClass = 'badge-practica';
                iconClass = 'fas fa-flask text-cyan-600';
                iconCircleClass = 'icon-circle-practica';
            } else if (tipoLower.includes('test') || tipoLower.includes('examen') || tipoLower.includes('evaluacion') || tipoLower.includes('quiz')) {
                badgeClass = 'badge-test';
                iconClass = 'fas fa-clipboard-check text-purple-600';
                iconCircleClass = 'icon-circle-test';
            } else if (tipoLower.includes('programa') || tipoLower.includes('software')) {
                badgeClass = 'badge-programa';
                iconClass = 'fas fa-download text-amber-600';
                iconCircleClass = 'icon-circle-programa';
            }
            
            html += `
            <a href="${enlace}" target="_blank" rel="noopener noreferrer" class="material-card">
                <div class="card-image-wrapper">
                    <img src="${imagen}" alt="${titulo}" loading="lazy" onerror="this.src='img/AA (1).gif'">
                    <div class="card-image-overlay"></div>
                    <span class="card-badge ${badgeClass}">${tipo}</span>
                    <div class="card-icon-circle ${iconCircleClass}">
                        <i class="${iconClass} text-lg"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${titulo}</h3>
                    <p class="card-subtitle">${descripcion}</p>
                </div>
                <div class="card-footer">
                    <span class="download-count-badge">
                        <i class="fas fa-download text-[10px]"></i>
                        <span>Descargar</span>
                    </span>
                    <span class="download-btn-text">Abrir <i class="fas fa-arrow-down"></i></span>
                </div>
            </a>`;
        });
        
        container.innerHTML = html;
    }
});