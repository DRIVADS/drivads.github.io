// JavaScript Document
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

  document.getElementById("sensorForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const sensor = {
      nombre: document.getElementById("nombreSensor").value.trim(),
      tipo_dato: document.getElementById("tipoDato").value.trim(),
      analogico_digital: document.getElementById("analogDigital").value,
      id_sensor: Math.random().toString(36).substring(2, 10)
    };

    try {
      const proxyUrl = "https://cors-anywhere.herokuapp.com/";
      const apiUrl = "https://smma-aobk.onrender.com/api/SENSORS";

      const response = await fetch(proxyUrl + apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensor)
      });

      if (response.ok) {
        mostrarAlerta("Sensor registrado correctamente ", "success");
        form.reset();
        form.classList.remove("was-validated");
      } else {
        const errorData = await response.json();
        mostrarAlerta("Error al registrar el sensor: " + (errorData.message || response.status), "danger");
      }
    } catch (error) {
      console.error("Error de red:", error);
      mostrarAlerta("Error de conexión al registrar el sensor", "danger");
    }
  });