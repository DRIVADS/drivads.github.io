// JavaScript Document
  // Función para mostrar alertas bonitas
  function mostrarAlerta(mensaje, tipo = "success") {
    const alertContainer = document.getElementById("alertContainer");
    const alertDiv = document.createElement("div");

    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show shadow`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alertDiv);

    // Auto eliminar después de 5 segundos
    setTimeout(() => {
      alertDiv.classList.remove("show");
      alertDiv.classList.add("hide");
      setTimeout(() => alertDiv.remove(), 500); // Esperar que termine animación
    }, 5000);
  }

  // Evento al enviar formulario
  document.getElementById("zonaForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    const zona = {
      localidad: document.getElementById("localidad").value.trim(),
      municipio: document.getElementById("municipio").value.trim(),
      estado: document.getElementById("estado").value,
      pais: document.getElementById("pais").value,
      codigoPostal: document.getElementById("codigoPostal").value,
      id_zona: Math.random().toString(36).substring(2, 12) // ID aleatorio
    };

    try {
      const proxyUrl = "";
      const apiUrl = "https://smma-aobk.onrender.com/api/zonas";

      const response = await fetch(proxyUrl + apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "http://localhost",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify(zona)
      });

      if (response.ok) {
        mostrarAlerta("Zona registrada correctamente.", "success");
        form.reset();
        form.classList.remove("was-validated");
      } else {
        const errorData = await response.json();
        mostrarAlerta("Error al registrar la zona: " + (errorData.message || response.status), "danger");
      }
    } catch (error) {
      console.error("Error de red:", error);
      mostrarAlerta("Error de conexión al registrar la zona.", "danger");
    }
  });