// JavaScript Document
  const proxy = "";
  const apiBase = "https://smma-aobk.onrender.com/api/zonas";
  let zonas = [];

  // Funciones para mostrar y ocultar carga bloqueando scroll de main
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

  async function obtenerZonas() {
    mostrarCargaMain();
    try {
      const res = await fetch(proxy + apiBase);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      zonas = await res.json();
      cargarSelects();
      mostrarZonas(zonas);
    } catch (err) {
      console.error("Error al obtener zonas:", err);
      mostrarAlerta("No se pudieron cargar los datos de zonas.", "danger");
    } finally {
      ocultarCargaMain();
    }
  }

  function cargarSelects() {
    const paisSel = document.getElementById("pais");
    const estadoSel = document.getElementById("estado");
    const municipioSel = document.getElementById("municipio");
    const localidadSel = document.getElementById("localidad");

    const actualizarSelect = (select, valores) => {
      select.innerHTML = `<option value="">Seleccionar...</option>` +
        [...new Set(valores)].map(v => `<option>${v}</option>`).join('');
    };

    actualizarSelect(paisSel, zonas.map(z => z.pais));

    paisSel.onchange = () => {
      const estados = zonas.filter(z => z.pais === paisSel.value).map(z => z.estado);
      actualizarSelect(estadoSel, estados);
      municipioSel.innerHTML = localidadSel.innerHTML = `<option value="">Seleccionar...</option>`;
    };

    estadoSel.onchange = () => {
      const municipios = zonas.filter(z => z.estado === estadoSel.value).map(z => z.municipio);
      actualizarSelect(municipioSel, municipios);
      localidadSel.innerHTML = `<option value="">Seleccionar...</option>`;
    };

    municipioSel.onchange = () => {
      const localidades = zonas.filter(z => z.municipio === municipioSel.value).map(z => z.localidad);
      actualizarSelect(localidadSel, localidades);
    };
  }

  function mostrarZonas(lista) {
    const tbody = document.getElementById("zonasBody");
    tbody.innerHTML = lista.map(z => `
      <tr>
        <td>${z.id_zona || 'N/A'}</td>
        <td>${z.localidad || 'N/A'}</td>
        <td>${z.municipio || 'N/A'}</td>
        <td>${z.estado || 'N/A'}</td>
        <td>${z.pais || 'N/A'}</td>
        <td>${z.codigoPostal || 'N/A'}</td>
        <td>
          <button class="btn btn-danger btn-sm col-12 mb-1" onclick="confirmarEliminacionZona('${z.id_zona}')">Eliminar</button>
          <button class="btn btn-info btn-sm col-12" onclick="modificarZona('${z.id_zona}', '${z.localidad}', '${z.municipio}', '${z.estado}', '${z.pais}', '${z.codigoPostal}')">Modificar</button>
        </td>
      </tr>
    `).join('');
  }

  document.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    const [pais, estado, municipio, localidad] = ["pais", "estado", "municipio", "localidad"].map(id => document.getElementById(id).value);

    const filtrado = zonas.filter(z =>
      (!pais || z.pais === pais) &&
      (!estado || z.estado === estado) &&
      (!municipio || z.municipio === municipio) &&
      (!localidad || z.localidad === localidad)
    );
    mostrarZonas(filtrado);
  });

  let idZonaAEliminar = null;

  function confirmarEliminacionZona(id) {
    idZonaAEliminar = id;
    const modal = new bootstrap.Modal(document.getElementById('modalEliminarZona'));
    modal.show();
  }

  document.getElementById('btnConfirmarEliminarZona').addEventListener('click', async () => {
    if (!idZonaAEliminar) return;
    mostrarCargaMain();
    try {
      const res = await fetch(proxy + `${apiBase}/${idZonaAEliminar}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarAlerta("Zona eliminada exitosamente.", "success");
        await obtenerZonas();
      } else {
        throw new Error("Falló la eliminación");
      }
    } catch (err) {
      console.error(err);
      mostrarAlerta("No se pudo eliminar la zona.", "danger");
    } finally {
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminarZona'));
      modal.hide();
      idZonaAEliminar = null;
      ocultarCargaMain();
    }
  });

  function modificarZona(id, localidad, municipio, estado, pais, codigoPostal) {
    document.getElementById("zonaIdM").value = id;
    document.getElementById("localidadZonaM").value = localidad;
    document.getElementById("municipioZonaM").value = municipio;
    document.getElementById("estadoZonaM").value = estado;
    document.getElementById("paisZonaM").value = pais;
    document.getElementById("codigoPostalZonaM").value = codigoPostal;

    new bootstrap.Modal(document.getElementById("modalModificarZona")).show();
  }

  function guardarCambiosZona() {
    const id = document.getElementById("zonaIdM").value;
    const zona = {
      localidad: document.getElementById("localidadZonaM").value.trim(),
      municipio: document.getElementById("municipioZonaM").value.trim(),
      estado: document.getElementById("estadoZonaM").value.trim(),
      pais: document.getElementById("paisZonaM").value.trim(),
      codigoPostal: document.getElementById("codigoPostalZonaM").value.trim()
    };

    if (Object.values(zona).some(v => !v)) {
      mostrarAlerta("Todos los campos son obligatorios.", "danger");
      return;
    }

    mostrarCargaMain();
    fetch(proxy + `${apiBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(zona)
    })
    .then(res => {
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    })
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById("modalModificarZona")).hide();
      mostrarAlerta("Zona actualizada correctamente.", "success");
      obtenerZonas();
    })
    .catch(err => {
      console.error(err);
      mostrarAlerta("Error al guardar cambios de zona.", "danger");
    })
    .finally(() => {
      ocultarCargaMain();
    });
  }

  function mostrarAlerta(mensaje, tipo = "info") {
    const id = `alert-${Date.now()}`;
    const alert = `
      <div id="${id}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `;
    const container = document.getElementById("alertContainer");
    container.insertAdjacentHTML("beforeend", alert);
    setTimeout(() => document.getElementById(id)?.remove(), 4000);
  }

  // Inicio
  obtenerZonas();