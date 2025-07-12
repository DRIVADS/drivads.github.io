// JavaScript Document
  const apiBase = 'https://cors-anywhere.herokuapp.com/https://smma-aobk.onrender.com';
  let sensoresCache = [];

  function mostrarAlerta(mensaje, tipo = 'success', tiempo = 3000) {
    const container = document.getElementById("alertContainer");

    const wrapper = document.createElement("div");
    wrapper.className = `alert alert-${tipo} alert-dismissible fade show`;
    wrapper.role = "alert";
    wrapper.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    container.appendChild(wrapper);

    setTimeout(() => {
      wrapper.classList.remove("show");
      wrapper.classList.add("hide");
      setTimeout(() => wrapper.remove(), 300);
    }, tiempo);
  }

  async function fetchData(url) {
    const res = await fetch(`${apiBase}${url}`);
    if (!res.ok) throw new Error(`Error al acceder a ${url}`);
    return res.json();
  }

  function createOption(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    return option;
  }

  async function loadZonas() {
    try {
      const zonas = await fetchData('/api/zonas');
      const selectZona = document.getElementById("zonaNodo");
      selectZona.innerHTML = '';
      selectZona.appendChild(createOption('', 'Selecciona una zona...'));

      zonas.forEach(zona => {
        const texto = `${zona.localidad}, ${zona.municipio}, ${zona.estado}, ${zona.pais}`;
        selectZona.appendChild(createOption(zona.id_zona, texto));
      });
    } catch (err) {
      console.error("Error al cargar zonas:", err);
      mostrarAlerta("No se pudieron cargar las zonas.", "danger");
    }
  }

  function llenarSelectSensores(select) {
    select.innerHTML = '';
    select.appendChild(createOption('', 'Selecciona un sensor...'));
    sensoresCache.forEach(sensor => {
      const value = JSON.stringify(sensor);
      const text = `${sensor.nombre} (${sensor.tipo_dato})`;
      select.appendChild(createOption(value, text));
    });
  }

  async function loadSensores() {
    try {
      sensoresCache = await fetchData('/api/SENSORS');
      document.querySelectorAll(".sensor-select").forEach(llenarSelectSensores);
    } catch (err) {
      console.error("Error al cargar sensores:", err);
      mostrarAlerta("No se pudieron cargar los sensores.", "danger");
    }
  }

  function agregarSensor() {
    const container = document.getElementById("sensor-container");

    const div = document.createElement("div");
    div.className = "row g-3 sensor-entry";
    div.innerHTML = `
      <div class="col-md-10">
        <label class="form-label">Seleccionar Sensor</label>
        <select class="form-select sensor-select" required>
          <option value="">Cargando sensores...</option>
        </select>
        <div class="invalid-feedback">Selecciona un sensor válido.</div>
      </div>
      <div class="col-md-2 d-flex align-items-end">
        <button type="button" class="btn btn-danger remove-sensor">−</button>
      </div>
    `;

    container.appendChild(div);
    llenarSelectSensores(div.querySelector(".sensor-select"));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await loadZonas();
    await loadSensores();

    document.getElementById("add-sensor").addEventListener("click", agregarSensor);

    document.getElementById("sensor-container").addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-sensor")) {
        e.target.closest(".sensor-entry").remove();
      }
    });

    document.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const inputs = form.querySelectorAll("input, select");
      let valid = true;
      let firstInvalid = null;

      inputs.forEach(input => {
        if (!input.checkValidity()) {
          input.classList.add("is-invalid");
          valid = false;


          if (!firstInvalid) firstInvalid = input;
        } else {
          input.classList.remove("is-invalid");
        }
      });

      const sensorSelects = form.querySelectorAll(".sensor-select");
      sensorSelects.forEach(select => {
        if (!select.value) {
          select.classList.add("is-invalid");
          valid = false;
          if (!firstInvalid) firstInvalid = select;
        } else {
          select.classList.remove("is-invalid");
        }
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        mostrarAlerta("Por favor corrige los campos marcados en rojo.", "warning");
        return;
      }

      const nodoData = {
        nombre: document.getElementById("nombreNodo").value,
        id_zona: document.getElementById("zonaNodo").value,
        fecha_imp: document.getElementById("fechaInstalacion").value,
        cordenadas: document.getElementById("coordenadas").value,
        mac: document.getElementById("ipMac").value,
        sensores: Array.from(sensorSelects).map(select => JSON.parse(select.value))
      };

      try {
        const res = await fetch(`${apiBase}/api/NODOS`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nodoData)
        });

        if (res.ok) {
          mostrarAlerta("Nodo registrado con éxito ", "success");
          form.reset();
          form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        } else {
          mostrarAlerta("Error al registrar el nodo ", "danger");
        }
      } catch (err) {
        console.error("Error al enviar el formulario:", err);
        mostrarAlerta("Hubo un problema al registrar el nodo.", "danger");
      }
    });
  });