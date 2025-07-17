// JavaScript Document
  const proxyUrl = '';
  const apiBase = `${proxyUrl}https://smma-aobk.onrender.com`;

  const selectPais = document.getElementById('pais');
  const selectEstado = document.getElementById('estado');
  const selectMunicipio = document.getElementById('municipio');
  const selectLocalidad = document.getElementById('localidad');
  const form = document.getElementById('filtro-form');
  const alertContainer = document.getElementById('alertContainer');
  const resultadoLista = document.getElementById('resultado-lista');
  const monitoreoContenedor = document.getElementById('monitoreo-contenedor');
  const sensoresContenedor = document.getElementById('sensores-contenedor');
  const tituloMonitoreo = document.getElementById('monitoreo-titulo');

  let zonasDisponibles = [];

  function mostrarCargaMain() {
	  document.getElementById('cargando-main').style.display = 'flex';
	  document.getElementById('main-content').classList.add('no-scroll'); // desactiva scroll en main
	}

	function ocultarCargaMain() {
	  document.getElementById('cargando-main').style.display = 'none';
	  document.getElementById('main-content').classList.remove('no-scroll'); // reactiva scroll en main
	}

  function deshabilitarSelects() {
    selectPais.disabled = true;
    selectEstado.disabled = true;
    selectMunicipio.disabled = true;
    selectLocalidad.disabled = true;
  }

  function habilitarSelects() {
    selectPais.disabled = false;
    selectEstado.disabled = false;
    selectMunicipio.disabled = false;
    selectLocalidad.disabled = false;
  }

  function llenarSelect(select, items) {
    select.innerHTML = '<option value="">Seleccionar...</option>';
    [...new Set(items)].forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
  }

  function abrirMapa(coordenadas) {
    if (!coordenadas || !coordenadas.includes(',')) {
      alert('Coordenadas inválidas');
      return;
    }

    const [lat, lng] = coordenadas.split(',').map(c => c.trim());

    if (isNaN(lat) || isNaN(lng)) {
      alert('Coordenadas inválidas');
      return;
    }

    const src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
    document.getElementById('iframeMapa').src = src;

    const modal = new bootstrap.Modal(document.getElementById('modalMapa'));
    modal.show();
  }

  function mostrarAlerta(mensaje, tipo = 'info') {
    const alertId = `alert-${Date.now()}`;
    const alertHTML = `
      <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>`;
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(() => {
      const alertEl = document.getElementById(alertId);
      if (alertEl) alertEl.remove();
    }, 4000);
  }

  async function obtenerZonas() {
    mostrarCargaMain();
    deshabilitarSelects();
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
      habilitarSelects();
      ocultarCargaMain();
    }
  }

  async function obtenerDatos(filtro = {}) {
    mostrarCargaMain();
    try {
      const res = await fetch(`${apiBase}/api/nodos`);
      if (!res.ok) throw new Error('Error al obtener nodos');
      const nodos = await res.json();

      const mapaZonas = new Map(zonasDisponibles.map(z => [z.id_zona || z._id, z]));

      const nodosFiltrados = nodos.filter(nodo => {
        const zona = mapaZonas.get(nodo.id_zona) || {};
        return (!filtro.pais || zona.pais === filtro.pais) &&
               (!filtro.estado || zona.estado === filtro.estado) &&
               (!filtro.municipio || zona.municipio === filtro.municipio) &&
               (!filtro.localidad || zona.localidad === filtro.localidad);
      });

      resultadoLista.innerHTML = '';
      monitoreoContenedor.innerHTML = '';
      sensoresContenedor.innerHTML = '';
      tituloMonitoreo.textContent = 'Monitoreo';

      if (nodosFiltrados.length === 0) {
        resultadoLista.innerHTML = '<li class="list-group-item">No se encontraron nodos con esos filtros.</li>';
        return;
      }

      nodosFiltrados.forEach(nodo => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-action';
        li.style.cursor = 'pointer';
        li.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <span>${nodo.nombre}</span>
            ${nodo.cordenadas ? `
              <button class="btn btn-outline-primary btn-sm ms-2" onclick="abrirMapa('${nodo.cordenadas}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe-americas" viewBox="0 0 16 16">
                  <use href="#Mundo"></use>
                </svg>
              </button>` : '<span class="text-muted small ms-2">(Sin coordenadas)</span>'}
          </div>`;
        li.addEventListener('click', () => {
          tituloMonitoreo.textContent = `Monitoreo - ${nodo.nombre}`;
          mostrarMonitoreoNodo(nodo.id_nodo);
          renderizarSensores(nodo.sensores || []);
        });
        resultadoLista.appendChild(li);
      });
    } catch (error) {
      mostrarAlerta('Error al obtener nodos.', 'danger');
      console.error(error);
    } finally {
      ocultarCargaMain();
    }
  }

  function obtenerGifPorTipo(tipo) {
    const tipoNormalizado = tipo.toLowerCase();
    switch (tipoNormalizado) {
      case 'temperatura': return 'imgs/particulas.gif';
      case 'uv': return 'imgs/radiacion-uv.gif';
      case 'humedad': return 'imgs/lluvia.gif';
      case 'angulo': return 'imgs/veleta.gif';
      case 'velocidad': return 'imgs/viento.gif';
      case 'co2': return 'imgs/co2.gif';
      case 'litros': return 'https://media.giphy.com/media/3o7TKsQmoCf6Q/giphy.gif';
      default: return 'imgs/particulas.gif';
    }
  }

  async function mostrarMonitoreoNodo(id_nodo) {
    mostrarCargaMain();
    try {
      const res = await fetch(`${apiBase}/api/monitoreos`);
      if (!res.ok) throw new Error('Error al obtener monitoreos');
      const monitoreos = await res.json();

      const monitoreosNodo = monitoreos.filter(m => m.id_nodo === id_nodo);

      if (monitoreosNodo.length === 0) {
        monitoreoContenedor.innerHTML = `<div class="col-12"><div class="alert alert-warning">El nodo no tiene monitoreo registrado.</div></div>`;
        return;
      }

      const monitoreoReciente = monitoreosNodo.reduce((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora}`);
        const fechaB = new Date(`${b.fecha}T${b.hora}`);
        return fechaA > fechaB ? a : b;
      });

      monitoreoContenedor.innerHTML = '';
      monitoreoReciente.Datos.forEach(dato => {
        const gifURL = obtenerGifPorTipo(dato.tipo);
        const card = `
          <div class="col-sm-6 col-lg-4 mb-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <img src="${gifURL}" alt="${dato.tipo}" style="height: 30px;">
                  <h5 class="card-title text-capitalize mb-0">${dato.tipo}</h5>
                </div>
                <p class="card-text">${dato.valor}</p>
                <p class="card-text"><small class="text-body-secondary">Última actualización ${monitoreoReciente.hora} - ${monitoreoReciente.fecha}</small></p>
              </div>
            </div>
          </div>`;
        monitoreoContenedor.insertAdjacentHTML('beforeend', card);
      });
    } catch (error) {
      mostrarAlerta('Error al obtener monitoreo.', 'danger');
      console.error(error);
    } finally {
      ocultarCargaMain();
    }
  }

  function renderizarSensores(sensores) {
    sensoresContenedor.innerHTML = '';
    sensores.forEach(sensor => {
      const div = document.createElement('div');
      div.className = 'col-sm-6 col-lg-4 mb-3';
      div.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">${sensor.nombre}</h6>
            <p class="card-text">Tipo: ${sensor.tipo_dato}</p>
            <p class="card-text">Modo: ${sensor.analogico_digital}</p>
          </div>
        </div>`;
      sensoresContenedor.appendChild(div);
    });
  }

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

  obtenerZonas().then(obtenerDatos);