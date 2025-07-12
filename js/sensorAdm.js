// JavaScript Document
  const proxy = "https://cors-anywhere.herokuapp.com/";
  const apiBase = "https://smma-aobk.onrender.com/api/sensors";
  let sensoresData = [];

  // Mostrar / ocultar carga bloqueando scroll main
  function mostrarCargaMain() {
    const main = document.querySelector('main');
    if (main) main.style.overflow = 'hidden';
    document.getElementById('cargando-main').style.display = 'flex';
  }
  function ocultarCargaMain() {
    const main = document.querySelector('main');
    if (main) main.style.overflow = 'auto';
    document.getElementById('cargando-main').style.display = 'none';
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(proxy + url, options);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json().catch(() => ({}));
  }

  async function obtenerSensores() {
    mostrarCargaMain();
    try {
      sensoresData = await apiRequest(apiBase);
      llenarFiltros(sensoresData);
      mostrarSensores(sensoresData);
    } catch (error) {
      console.error("Error al obtener sensores:", error);
      mostrarAlerta("No se pudieron cargar los datos de sensores.", "danger");
    } finally {
      ocultarCargaMain();
    }
  }

  function llenarFiltros(sensores) {
    const tipoDatoSelect = document.getElementById('tipoDato');
    const tipoSensorSelect = document.getElementById('tipoSensor');
    const tiposDato = [...new Set(sensores.map(s => s.tipo_dato).filter(Boolean))];
    const tiposSensor = [...new Set(sensores.map(s => s.analogico_digital).filter(Boolean))];

    llenarSelect(tipoDatoSelect, tiposDato);
    llenarSelect(tipoSensorSelect, tiposSensor);
  }

  function llenarSelect(selectElement, options) {
    selectElement.innerHTML = '<option value="">Todos</option>';
    options.forEach(value => {
      selectElement.insertAdjacentHTML('beforeend', `<option value="${value}">${value}</option>`);
    });
  }

  function mostrarSensores(sensores) {
    const tbody = document.getElementById('sensoresBody');
    tbody.innerHTML = '';

    if (sensores.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="5" class="text-center text-muted fs-5">
          No se encontraron sensores para los filtros seleccionados.
        </td>
      `;
      tbody.appendChild(tr);
      return;
    }

    tbody.innerHTML = sensores.map(sensor => `
      <tr>
        <td>${sensor.nombre || 'N/A'}</td>
        <td>${sensor.tipo_dato || 'N/A'}</td>
        <td>${sensor.analogico_digital || 'N/A'}</td>
        <td>${sensor.id_sensor || 'N/A'}</td>
        <td>
          <button class="btn btn-danger btn-sm col-12 mb-1" onclick="confirmarEliminacionSensor('${sensor.id_sensor}')">Eliminar</button>
          <button class="btn btn-info btn-sm col-12" onclick="modificarSensor('${sensor.id_sensor}', '${sensor.analogico_digital}', '${sensor.nombre}', '${sensor.tipo_dato}')">Modificar</button>
        </td>
      </tr>
    `).join('');
  }

  function filtrarSensores() {
    const tipoDato = document.getElementById('tipoDato').value;
    const tipoSensor = document.getElementById('tipoSensor').value;

    const filtrados = sensoresData.filter(sensor =>
      (!tipoDato || sensor.tipo_dato === tipoDato) &&
      (!tipoSensor || sensor.analogico_digital === tipoSensor)
    );

    mostrarSensores(filtrados);
  }

  let idSensorAEliminar = null;

  function confirmarEliminacionSensor(id) {
    idSensorAEliminar = id;
    const modal = new bootstrap.Modal(document.getElementById('modalEliminarSensor'));
    modal.show();
  }

  document.getElementById('btnConfirmarEliminarSensor').addEventListener('click', async () => {
    if (!idSensorAEliminar) return;

    mostrarCargaMain();
    try {
      await apiRequest(`${apiBase}/${idSensorAEliminar}`, { method: 'DELETE' });
      mostrarAlerta('Sensor eliminado exitosamente.', 'success');
      await obtenerSensores();
    } catch (error) {
      console.error(error);
      mostrarAlerta('Error al eliminar el sensor.', 'danger');
    } finally {
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminarSensor'));
      modal.hide();
      idSensorAEliminar = null;
      ocultarCargaMain();
    }
  });

  function modificarSensor(id, tipo, nombre, dato) {
    document.getElementById("sensorIdM").value = id;
    document.getElementById("tipoSensorM").value = tipo?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    document.getElementById("nombreSensorM").value = nombre || "";
    document.getElementById("tipoDatoM").value = dato || "";

    new bootstrap.Modal(document.getElementById('modalModificar')).show();
  }

  async function guardarCambios() {
    const id = document.getElementById("sensorIdM").value;
    const tipo = document.getElementById("tipoSensorM").value.trim().toLowerCase();
    const nombre = document.getElementById("nombreSensorM").value.trim();
    const dato = document.getElementById("tipoDatoM").value.trim();

    if (!nombre || !tipo || !dato) {
      mostrarAlerta('Por favor completa todos los campos.', 'danger');
      return;
    }

    mostrarCargaMain();
    try {
      await apiRequest(`${apiBase}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analogico_digital: tipo, nombre, tipo_dato: dato })
      });
      bootstrap.Modal.getInstance(document.getElementById('modalModificar')).hide();
      mostrarAlerta('Sensor actualizado correctamente.', 'success');
      await obtenerSensores();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      mostrarAlerta('Error al guardar los cambios.', 'danger');
    } finally {
      ocultarCargaMain();
    }
  }

  function mostrarAlerta(mensaje, tipo = 'info') {
    const id = `alert-${Date.now()}`;
    document.getElementById('alertContainer').insertAdjacentHTML('beforeend', `
      <div id="${id}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `);
    setTimeout(() => document.getElementById(id)?.remove(), 4000);
  }

  document.getElementById('tipoDato').addEventListener('change', filtrarSensores);
  document.getElementById('tipoSensor').addEventListener('change', filtrarSensores);

  obtenerSensores();