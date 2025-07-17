// JavaScript Document
  const proxyUrl = '';
  const apiBase = `${proxyUrl}https://smma-aobk.onrender.com`;

  const selectPais = document.getElementById('pais');
  const selectEstado = document.getElementById('estado');
  const selectMunicipio = document.getElementById('municipio');
  const selectLocalidad = document.getElementById('localidad');
  const form = document.querySelector('form');
  const alertContainer = document.getElementById('alertContainer');

  let zonasDisponibles = [];

  // ========== UTILIDADES ==========
  function llenarSelect(select, items) {
    select.innerHTML = '<option value="">Seleccionar...</option>';
    [...new Set(items)].forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
  }

  function mostrarAlerta(mensaje, tipo = 'info') {
    const alertId = `alert-${Date.now()}`;
    const alertHTML = `
      <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `;
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(() => {
      const alertEl = document.getElementById(alertId);
      if (alertEl) alertEl.remove();
    }, 4000);
  }

  // ========== BLOQUEO DE CARGA ==========
  function mostrarCargaMain() {
    const main = document.querySelector('main');
    main.style.overflow = 'hidden';
    document.getElementById('cargando-main').style.display = 'flex';
  }

  function ocultarCargaMain() {
    const main = document.querySelector('main');
    main.style.overflow = 'auto';
    document.getElementById('cargando-main').style.display = 'none';
  }

  // ========== ZONAS ==========
  async function obtenerZonas() {
    mostrarCargaMain();
    try {
      const res = await fetch(`${apiBase}/api/zonas`);
      if (!res.ok) throw new Error('Error al obtener zonas');
      zonasDisponibles = await res.json();
      const paises = zonasDisponibles.map(z => z.pais);
      llenarSelect(selectPais, paises);
    } catch (error) {
      mostrarAlerta('Error al cargar zonas.', 'danger');
      console.error(error);
    } finally {
      ocultarCargaMain();
    }
  }

  // ========== NODOS ==========
  async function obtenerDatos(filtro = {}) {
    mostrarCargaMain();
    try {
      const resNodos = await fetch(`${apiBase}/api/nodos`);
      if (!resNodos.ok) throw new Error('Error al obtener nodos');
      const nodos = await resNodos.json();
      const tbody = document.getElementById('tabla-cuerpo');
      tbody.innerHTML = '';

      const mapaZonas = new Map(zonasDisponibles.map(z => [z.id_zona || z._id, z]));

      const nodosFiltrados = nodos.filter(nodo => {
        const zona = mapaZonas.get(nodo.id_zona) || {};
        return (!filtro.pais || zona.pais === filtro.pais) &&
               (!filtro.estado || zona.estado === filtro.estado) &&
               (!filtro.municipio || zona.municipio === filtro.municipio) &&
               (!filtro.localidad || zona.localidad === filtro.localidad);
      });

      if (nodosFiltrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="10" class="text-center text-muted fs-5">No se encontraron nodos para los filtros seleccionados.</td>`;
        tbody.appendChild(tr);
        return;
      }

      nodosFiltrados.forEach(nodo => {
        const zona = mapaZonas.get(nodo.id_zona) || {};
        const sensoresNombres = (nodo.sensores || [])
          .map(s => `${s.nombre}/${s.tipo_dato}/${s.analogico_digital}`)
          .join('<br>');

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${nodo.nombre || ''}</td>
          <td class="text-center align-middle">
            <button class="btn btn-outline-primary btn-sm" onclick="abrirMapa('${nodo.cordenadas}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe-americas" viewBox="0 0 16 16">
				  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484q-.121.12-.242.234c-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 1 2.04 4.327Z"/>
				</svg>
            </button>
          </td>
          <td>${nodo.fecha_imp || ''}</td>
          <td>${nodo.mac || ''}</td>
          <td style="max-height: 100px; overflow-y: auto; white-space: normal; word-break: break-word;">
            <span class="text-truncate d-inline-block" style="max-width: 200px;">${sensoresNombres}</span>
          </td>
          <td>${zona.localidad || ''}</td>
          <td>${zona.municipio || ''}</td>
          <td>${zona.estado || ''}</td>
          <td>${zona.codigoPostal || ''}</td>
          <td>
            <button class="btn btn-danger btn-sm col-12 mb-1" onclick="confirmarEliminacion('${nodo.id_nodo}')">Eliminar</button>
            <button class="btn btn-info btn-sm col-12" onclick="modificarNodo('${nodo.id_nodo}')">Modificar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      mostrarAlerta('Error al obtener datos.', 'danger');
      console.error(error);
    } finally {
      ocultarCargaMain();
    }
  }

  let idNodoAEliminar = null;

  function confirmarEliminacion(id) {
    idNodoAEliminar = id;
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
    modal.show();
  }

  document.getElementById('btnEliminarConfirmado').addEventListener('click', async () => {
    if (!idNodoAEliminar) return;

    try {
      const res = await fetch(`${apiBase}/api/nodos/${idNodoAEliminar}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarAlerta('Nodo eliminado exitosamente.', 'success');
        obtenerDatos();
      } else {
        throw new Error();
      }
    } catch (error) {
      mostrarAlerta('Error al eliminar nodo.', 'danger');
      console.error(error);
    } finally {
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar'));
      modal.hide();
      idNodoAEliminar = null;
    }
  });

  async function cargarZonasModal() {
    const selectZona = document.getElementById("zonaNodoM");
    selectZona.innerHTML = '<option value="">Selecciona una zona...</option>';
    zonasDisponibles.forEach(zona => {
      const option = document.createElement("option");
      option.value = zona.id_zona;
      option.textContent = `${zona.localidad}, ${zona.municipio}, ${zona.estado}, ${zona.pais}`;
      selectZona.appendChild(option);
    });
  }

  async function modificarNodo(id_nodo) {
    try {
      await cargarZonasModal();
      const res = await fetch(`${apiBase}/api/nodos/${id_nodo}`);
      if (!res.ok) throw new Error('Nodo no encontrado');
      const nodo = await res.json();

      document.getElementById("idNodoM").value = nodo.id_nodo;
      document.getElementById("nombreNodoM").value = nodo.nombre;
      document.getElementById("zonaNodoM").value = nodo.id_zona;
      document.getElementById("fechaInstalacionM").value = nodo.fecha_imp;
      document.getElementById("ipMacM").value = nodo.mac;
      document.getElementById("coordenadasM").value = nodo.cordenadas;

      const resSensores = await fetch(`${apiBase}/api/SENSORS`);
      if (!resSensores.ok) throw new Error('No se pudieron cargar sensores');
      const sensoresDisponibles = await resSensores.json();

      const container = document.getElementById("sensorContainerM");
      container.innerHTML = '';

      (nodo.sensores.length ? nodo.sensores : [null]).forEach(sensor =>
        container.appendChild(crearSensorSelect(sensoresDisponibles, sensor))
      );

      const modal = new bootstrap.Modal(document.getElementById('modalModificarNodo'));
      modal.show();
    } catch (error) {
      mostrarAlerta('Error al cargar el nodo o sensores.', 'danger');
      console.error(error);
    }
  }

  function crearSensorSelect(sensoresDisponibles, sensorSeleccionado) {
    const div = document.createElement("div");
    div.classList.add("row", "g-3", "sensor-entry");

    const selectHTML = `
      <div class="col-md-10">
        <label class="form-label">Seleccionar Sensor</label>
        <select class="form-select sensor-select" required>
          <option value="">Selecciona un sensor...</option>
          ${sensoresDisponibles.map(sensor =>
            `<option value='${JSON.stringify(sensor)}' ${sensorSeleccionado && sensor.id_sensor === sensorSeleccionado.id_sensor ? "selected" : ""}>
              ${sensor.nombre} (${sensor.tipo_dato})
            </option>`
          ).join('')}
        </select>
        <div class="invalid-feedback">Selecciona un sensor válido.</div>
      </div>
      <div class="col-md-2 d-flex align-items-end">
        <button type="button" class="btn btn-danger remove-sensor">−</button>
      </div>
    `;
    div.innerHTML = selectHTML;
    div.querySelector(".remove-sensor").addEventListener("click", () => div.remove());
    return div;
  }

  document.getElementById("addSensorM").addEventListener("click", async () => {
    try {
      const res = await fetch(`${apiBase}/api/SENSORS`);
      const sensoresDisponibles = await res.json();
      const container = document.getElementById("sensorContainerM");
      container.appendChild(crearSensorSelect(sensoresDisponibles, null));
    } catch (error) {
      mostrarAlerta('Error al cargar sensores para agregar.', 'danger');
      console.error(error);
    }
  });

  function abrirMapa(coordenadas) {
    if (!coordenadas || !coordenadas.includes(',')) {
      mostrarAlerta('Coordenadas inválidas.', 'warning');
      return;
    }
    const [lat, lng] = coordenadas.split(',').map(coord => coord.trim());
    const src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
    document.getElementById('iframeMapa').src = src;
    const modal = new bootstrap.Modal(document.getElementById('modalMapa'));
    modal.show();
  }

  async function guardarCambiosNodo() {
    const form = document.getElementById("formModificarNodo");
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      mostrarAlerta('Por favor completa todos los campos.', 'danger');
      return;
    }

    const id_nodo = document.getElementById("idNodoM").value;

    let sensores;
    try {
      sensores = [...document.querySelectorAll("#sensorContainerM select.sensor-select")].map(s => {
        if (!s.value) throw new Error('Sensor no seleccionado');
        return JSON.parse(s.value);
      });
    } catch (error) {
      mostrarAlerta('Por favor selecciona un sensor válido en cada entrada.', 'danger');
      console.error(error);
      return;
    }

    const nodoActualizado = {
      nombre: document.getElementById("nombreNodoM").value.trim(),
      id_zona: document.getElementById("zonaNodoM").value,
      fecha_imp: document.getElementById("fechaInstalacionM").value,
      mac: document.getElementById("ipMacM").value.trim(),
      cordenadas: document.getElementById("coordenadasM").value.trim(),
      sensores
    };

    try {
      const res = await fetch(`${apiBase}/api/nodos/${id_nodo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodoActualizado)
      });
      if (!res.ok) throw new Error();

      bootstrap.Modal.getInstance(document.getElementById('modalModificarNodo')).hide();
      mostrarAlerta('Nodo actualizado correctamente.', 'success');
      obtenerDatos();
    } catch (error) {
      mostrarAlerta('Error al guardar cambios.', 'danger');
      console.error(error);
    }
  }

  // ========== EVENTOS ==========
  form.addEventListener('submit', e => {
    e.preventDefault();
    obtenerDatos({
      pais: selectPais.value || null,
      estado: selectEstado.value || null,
      municipio: selectMunicipio.value || null,
      localidad: selectLocalidad.value || null
    });
  });

  selectEstado.addEventListener('change', () => {
    const municipios = zonasDisponibles
      .filter(z => z.pais === selectPais.value && z.estado === selectEstado.value)
      .map(z => z.municipio);
    llenarSelect(selectMunicipio, municipios);
    selectLocalidad.innerHTML = '<option value="">Seleccionar...</option>';
  });

  selectMunicipio.addEventListener('change', () => {
    const localidades = zonasDisponibles
      .filter(z =>
        z.pais === selectPais.value &&
        z.estado === selectEstado.value &&
        z.municipio === selectMunicipio.value
      )
      .map(z => z.localidad);
    llenarSelect(selectLocalidad, localidades);
  });

  selectPais.addEventListener('change', () => {
    const estados = zonasDisponibles
      .filter(z => z.pais === selectPais.value)
      .map(z => z.estado);
    llenarSelect(selectEstado, estados);
    selectMunicipio.innerHTML = '<option value="">Seleccionar...</option>';
    selectLocalidad.innerHTML = '<option value="">Seleccionar...</option>';
  });

  // ========== INICIO ==========
  obtenerZonas().then(obtenerDatos);