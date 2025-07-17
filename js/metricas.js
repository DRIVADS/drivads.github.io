// JavaScript Document
  const proxyUrl = '';
  const apiBase = `${proxyUrl}https://smma-aobk.onrender.com`;

  const selectPais = document.getElementById('pais');
  const selectEstado = document.getElementById('estado');
  const selectMunicipio = document.getElementById('municipio');
  const selectLocalidad = document.getElementById('localidad');
  const formBusqueda = document.getElementById('busqueda-form');
  const resultadoLista = document.getElementById('resultado-lista');
  const filtroMonitoreoForm = document.getElementById('filtro-monitoreo-form');
  const checkboxContaminantes = document.getElementById('checkbox-contaminantes');
  const chartsRow = document.getElementById('charts-row');
  const btnDescargarCSV = document.getElementById('btn-descargar-csv');

  const inputInicio = document.getElementById('fecha-inicio');
  const inputFin = document.getElementById('fecha-fin');

  let zonasDisponibles = [];

  const colores = ['#0b62a4', '#7A92A3', '#4DA74D', '#AFD8F8', '#EDC240', '#cb4b4b', '#9440ed'];

  function mostrarLoading(mostrar) {
    const cargando = document.getElementById('cargando-main');
    if (cargando) cargando.style.display = mostrar ? 'flex' : 'none';
  }

  function llenarSelect(select, items) {
    select.innerHTML = '<option value="">Seleccionar...</option>';
    [...new Set(items)].filter(Boolean).sort().forEach(item => {
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

  async function obtenerZonas() {
    mostrarLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/zonas`);
      if (!res.ok) throw new Error('Error al obtener zonas');
      zonasDisponibles = await res.json();
      llenarSelect(selectPais, zonasDisponibles.map(z => z.pais));
    } catch (error) {
      console.error('Error al cargar zonas:', error);
    } finally {
      mostrarLoading(false);
    }
  }

  async function obtenerDatosUbicacion(filtro = {}) {
    mostrarLoading(true);
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
      checkboxContaminantes.innerHTML = '';

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
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484q-.121.12-.242.234c-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5.78-.39.952-.171 1.227.182.078.099.163.208.273.318.609.304.662-.132.723-.633.039-.322.081-.671.277-.867.434-.434 1.265-.791 2.028-1.12.712-.306 1.365-.587 1.579-.88A7 7 0 1 1 2.04 4.327Z"/>
                </svg>
              </button>
            ` : '<span class="text-muted small ms-2">(Sin coordenadas)</span>'}
          </div>
        `;

        li.addEventListener('click', async () => {
          localStorage.setItem('nodoSeleccionado', nodo.id_nodo);
          mostrarLoading(true);
          try {
            const resMonitoreos = await fetch(`${apiBase}/api/monitoreos?id_nodo=${nodo.id_nodo}`);
            if (!resMonitoreos.ok) throw new Error('Error al obtener monitoreos');
            const monitoreos = await resMonitoreos.json();
            if (monitoreos.length === 0) {
              checkboxContaminantes.innerHTML = '<p class="text-muted">No hay monitoreos disponibles para este nodo.</p>';
              return;
            }

            const fechas = monitoreos.map(m => m.fecha).sort();
            if (!inputInicio.value) inputInicio.value = fechas[0];
            if (!inputFin.value) inputFin.value = fechas[fechas.length - 1];
            inputInicio.max = fechas[fechas.length - 1];
            inputFin.min = fechas[0];

            const monitoreoReciente = monitoreos[monitoreos.length - 1];
            renderizarCheckboxContaminantes(monitoreoReciente);
          } catch (error) {
            console.error('Error al obtener monitoreos:', error);
          } finally {
            mostrarLoading(false);
          }
        });

        resultadoLista.appendChild(li);
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mostrarLoading(false);
    }
  }

  inputInicio.addEventListener('input', () => {
    inputFin.min = inputInicio.value || '';
  });

  inputFin.addEventListener('input', () => {
    inputInicio.max = inputFin.value || '';
  });

  function renderizarCheckboxContaminantes(monitoreo) {
    checkboxContaminantes.innerHTML = '';
    if (!monitoreo || !Array.isArray(monitoreo.Datos)) return;

    const tipos = [...new Set(monitoreo.Datos.map(d => d.tipo))];
    tipos.forEach((tipo, i) => {
      const div = document.createElement('div');
      div.className = 'form-check col-md-2 mb-2';
      div.innerHTML = `
        <input class="form-check-input" type="checkbox" value="${tipo}" id="contaminante-${i}" checked>
        <label class="form-check-label" for="contaminante-${i}">${tipo}</label>
      `;
      checkboxContaminantes.appendChild(div);
    });
  }

  selectPais.addEventListener('change', () => {
    const estados = zonasDisponibles.filter(z => z.pais === selectPais.value).map(z => z.estado);
    llenarSelect(selectEstado, estados);
    selectMunicipio.innerHTML = '<option value="">Seleccionar...</option>';
    selectLocalidad.innerHTML = '<option value="">Seleccionar...</option>';
  });

  selectEstado.addEventListener('change', () => {
    const municipios = zonasDisponibles.filter(z => z.pais === selectPais.value && z.estado === selectEstado.value).map(z => z.municipio);
    llenarSelect(selectMunicipio, municipios);
    selectLocalidad.innerHTML = '<option value="">Seleccionar...</option>';
  });

  selectMunicipio.addEventListener('change', () => {
    const localidades = zonasDisponibles.filter(z => z.pais === selectPais.value && z.estado === selectEstado.value && z.municipio === selectMunicipio.value).map(z => z.localidad);
    llenarSelect(selectLocalidad, localidades);
  });

  formBusqueda.addEventListener('submit', e => {
    e.preventDefault();
    obtenerDatosUbicacion({
      pais: selectPais.value,
      estado: selectEstado.value,
      municipio: selectMunicipio.value,
      localidad: selectLocalidad.value
    });
  });

  filtroMonitoreoForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nodoSeleccionado = localStorage.getItem('nodoSeleccionado');
    if (!nodoSeleccionado) return alert('Selecciona un nodo primero.');

    const fechaInicio = inputInicio.value;
    const fechaFin = inputFin.value;

    let url = `${apiBase}/api/monitoreos?id_nodo=${nodoSeleccionado}`;
    if (fechaInicio) url += `&fecha_ini=${fechaInicio}`;
    if (fechaFin) url += `&fecha_fin=${fechaFin}`;

    mostrarLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener datos');
      const monitoreos = await res.json();

      window.monitoreosFiltrados = monitoreos;

      if (!monitoreos.length) {
        chartsRow.innerHTML = '<p class="text-muted">No hay datos en ese rango.</p>';
        return;
      }

      const tiposSeleccionados = Array.from(checkboxContaminantes.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
      if (!tiposSeleccionados.length) return alert('Selecciona al menos un tipo de dato.');

      const datosParaGrafica = monitoreos.map(m => {
        const base = { fecha_hora: `${m.fecha} ${m.hora}` };
        tiposSeleccionados.forEach(tipo => {
          const encontrado = m.Datos.find(d => d.tipo === tipo);
          base[tipo] = encontrado ? parseFloat(encontrado.valor) || 0 : 0;
        });
        return base;
      });

      chartsRow.innerHTML = '';
      tiposSeleccionados.forEach((tipo, i) => {
        const col = document.createElement('div');
        col.className = 'col-md-12 mb-4';

        const card = document.createElement('div');
        card.className = 'card shadow';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h6');
        title.className = 'card-title';
        title.textContent = `Gráfica de ${tipo.toUpperCase()}`;

        const chartDiv = document.createElement('div');
        chartDiv.id = `grafica-${tipo}`;
        chartDiv.style.height = '300px';

        cardBody.appendChild(title);
        cardBody.appendChild(chartDiv);
        card.appendChild(cardBody);
        col.appendChild(card);
        chartsRow.appendChild(col);

        const datosTipo = datosParaGrafica.map(d => ({
          fecha_hora: d.fecha_hora,
          valor: d[tipo]
        }));

        new Morris.Line({
          element: chartDiv.id,
          data: datosTipo,
          xkey: 'fecha_hora',
          ykeys: ['valor'],
          labels: [tipo.toUpperCase()],
          parseTime: false,
          lineColors: [colores[i % colores.length]],
          resize: true
        });
      });
    } catch (err) {
      console.error('Error al graficar:', err);
      chartsRow.innerHTML = '<p class="text-danger">Error al generar gráficas.</p>';
    } finally {
      mostrarLoading(false);
    }
  });

  document.getElementById('btn-descargar-csv').addEventListener('click', () => {
    if (window.monitoreosFiltrados) {
      descargarCSVDeMonitoreos(window.monitoreosFiltrados);
    } else {
      alert('Primero realiza una búsqueda con el filtro.');
    }
  });

  function descargarCSVDeMonitoreos(monitoreos) {
    if (!monitoreos.length) return alert('No hay datos para descargar.');

    const encabezados = ['id_monitoreo', 'id_nodo', 'fecha', 'hora', 'tipo', 'valor'];
    const filas = [];

    monitoreos.forEach(m => {
      m.Datos.forEach(d => {
        filas.push([
          m.id_monitoreo,
          m.id_nodo,
          m.fecha,
          m.hora,
          d.tipo,
          d.valor
        ]);
      });
    });

    let csvContent = encabezados.join(',') + '\n';
    csvContent += filas.map(fila => fila.map(val => `"${val}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'monitoreo.csv');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 🚀 Mostrar loading desde el principio
  mostrarLoading(true);
  obtenerZonas();