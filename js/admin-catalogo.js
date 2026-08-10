// js/admin-catalogo.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const cargarBtn = document.getElementById('cargarExcelBtn');
    const guardarBtn = document.getElementById('guardarCursosBtn');
    const inputArchivo = document.getElementById('archivoExcel');
    const tablaCursosBody = document.querySelector('#tablaCursos tbody');

    // Variable para almacenar los datos de los cursos
    let datosCursos = [];

    // Función para renderizar (dibujar) la tabla con los datos de los cursos
    const renderizarTabla = () => {
        if (!tablaCursosBody) return;
        tablaCursosBody.innerHTML = ''; // Limpiar la tabla antes de dibujar

        datosCursos.forEach((curso, index) => {
            const fila = document.createElement('tr');
            fila.dataset.index = index;
            fila.innerHTML = `
                <td><input type="text" value="${curso.Curso || ''}" data-col="Curso" class="input-tabla"></td>
                <td><input type="text" value="${curso.Nombre || ''}" data-col="Nombre" class="input-tabla"></td>
                <td><textarea data-col="Info" class="textarea-tabla">${curso.Info || ''}</textarea></td>
                <td><textarea data-col="Aula" class="textarea-tabla">${curso.Aula || ''}</textarea></td>
                <td><textarea data-col="Materiales" class="textarea-tabla">${curso.Materiales || ''}</textarea></td>
                <td><button class="btn-eliminar" title="Eliminar Fila"><i class="fas fa-trash-alt"></i></button></td>
            `;
            tablaCursosBody.appendChild(fila);
        });
    };

    // Evento para el botón "Cargar Cursos del Excel"
    cargarBtn.addEventListener('click', () => {
        const archivo = inputArchivo.files[0];
        if (!archivo) {
            alert('Por favor, selecciona un archivo Excel.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const nombrePestana = 'Catalogo';
                if (!workbook.SheetNames.includes(nombrePestana)) {
                    alert(`Error: El archivo Excel no tiene una pestaña llamada "${nombrePestana}".`);
                    return;
                }

                const worksheet = workbook.Sheets[nombrePestana];
                datosCursos = XLSX.utils.sheet_to_json(worksheet);
                
                renderizarTabla();
                alert('Cursos cargados desde Excel. Revisa la tabla y presiona "Guardar Cambios" para confirmar.');
            } catch (error) {
                console.error("Error al procesar el archivo Excel:", error);
                alert("Hubo un error al leer el archivo Excel. Asegúrate de que el formato es correcto y que no esté dañado.");
            }
        };
        reader.readAsArrayBuffer(archivo);
    });

    // Evento para el botón "Guardar Cambios"
    guardarBtn.addEventListener('click', () => {
        const filas = tablaCursosBody.querySelectorAll('tr');
        const cursosActualizados = [];
        filas.forEach(fila => {
            const curso = {};
            fila.querySelectorAll('input[data-col], textarea[data-col]').forEach(el => {
                curso[el.dataset.col] = el.value;
            });
            cursosActualizados.push(curso);
        });
        
        datosCursos = cursosActualizados; // Actualiza el array principal con los datos de la tabla
        localStorage.setItem('catalogoDeCursos', JSON.stringify(datosCursos));
        alert('¡Catálogo de cursos guardado con éxito!');
    });

    // Cargar los cursos guardados en localStorage al iniciar la página
    const cargarCursosIniciales = () => {
        const cursosGuardados = localStorage.getItem('catalogoDeCursos');
        if (cursosGuardados) {
            datosCursos = JSON.parse(cursosGuardados);
            renderizarTabla();
        }
    };
    
    // Delegación de eventos para eliminar filas de la tabla
    tablaCursosBody.addEventListener('click', (e) => {
        const botonEliminar = e.target.closest('.btn-eliminar');
        if (botonEliminar) {
            const fila = botonEliminar.closest('tr');
            const nombreCurso = fila.querySelector('[data-col="Nombre"]').value || 'este curso';
            if (confirm(`¿Estás seguro de que quieres eliminar "${nombreCurso}"? Los cambios no serán permanentes hasta que presiones "Guardar Cambios".`)) {
                fila.remove();
            }
        }
    });

    cargarCursosIniciales();
});