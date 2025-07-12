// JavaScript Document
  document.getElementById("registro-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellidoPa = document.getElementById("apellidoPa").value.trim();
    const apellidoMa = document.getElementById("apellidoMa").value.trim();
    const fechaNacimiento = document.getElementById("fecha").value;
    const institucion = document.getElementById("Institución").value;
    const cargo = document.getElementById("Cargo").value;
    const correo = document.getElementById("floatingInput").value.trim();
    const contrasena = document.getElementById("floatingPassword").value;

    if (!nombre || !apellidoPa || !correo || !contrasena) {
      mostrarAlerta("Por favor llena todos los campos obligatorios.", "danger");
      return;
    }

    const proxy = "https://cors-anywhere.herokuapp.com/";
    const api = "https://smma-aobk.onrender.com/api/usuarios";

    try {
      // Verificar si ya existe un usuario con ese correo
      const usuariosRes = await fetch(proxy + api);
      const usuarios = await usuariosRes.json();
      const existeCorreo = usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase());

      if (existeCorreo) {
        mostrarAlerta("El correo ya está registrado. Usa otro.", "warning");
        return;
      }

      // Enviar nuevo usuario
      const nuevoUsuario = {
        nombre,
        apellido_pa: apellidoPa,
        apellido_ma: apellidoMa,
        fechaNacimiento,
        institucion,
        cargo,
        correo,
        contrasena,
        Rol: "Usuario"
      };

      const res = await fetch(proxy + api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoUsuario)
      });

      if (!res.ok) {
        const err = await res.json();
        mostrarAlerta("Error al registrar: " + (err.message || "Intenta más tarde."), "danger");
        return;
      }

      // Mostrar modal de éxito
      const modal = new bootstrap.Modal(document.getElementById('registroExitosoModal'));
      modal.show();

      // Al cerrar el modal, redirigir al index
      document.getElementById("btnAceptarRegistro").addEventListener("click", () => {
        window.location.href = "../index.htm";
      });

    } catch (err) {
      console.error(err);
      mostrarAlerta("Error inesperado al registrar.", "danger");
    }
  });

  function mostrarAlerta(mensaje, tipo = "info") {
    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.role = "alert";
    alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    document.getElementById("alertContainer").appendChild(alerta);

    // Remover la alerta después de 5 segundos
    setTimeout(() => {
      alerta.remove();
    }, 5000);
  }
