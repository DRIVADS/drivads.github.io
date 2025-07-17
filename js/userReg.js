// JavaScript Document
// JavaScript Document
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registro-form");

  form.addEventListener("submit", async function (e) {
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
      mostrarModalError("Por favor llena todos los campos obligatorios.");
      return;
    }

    const proxy = "";
    const api = "https://smma-aobk.onrender.com/api/usuarios";
    const modalCargando = new bootstrap.Modal(document.getElementById("cargandoModal"), {
	  backdrop: 'static',
	  keyboard: false
	});

    try {
      // Verificar si ya existe un usuario con ese correo
      const usuariosRes = await fetch(proxy + api);
      const usuarios = await usuariosRes.json();
      const existeCorreo = usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase());

      if (existeCorreo) {
        modalCargando.hide();
        mostrarModalError("El correo ya está registrado. Usa otro.");
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

      modalCargando.hide();

      if (!res.ok) {
        const err = await res.json();
        mostrarModalError("Error al registrar: " + (err.message || "Intenta más tarde."));
        return;
      }

      const modalExito = new bootstrap.Modal(document.getElementById('registroExitosoModal'), {});
      modalExito.show();

    } catch (err) {
      console.error(err);
      modalCargando.hide();
      mostrarModalError("Error inesperado al registrar.");
    }
  });

  // Botón de redirección después del registro exitoso
  document.getElementById("btnAceptarRegistro").addEventListener("click", () => {
    window.location.href = "../index.htm";
  });
});

// Mostrar error en un modal
function mostrarModalError(mensaje) {
  const mensajeEl = document.getElementById("mensajeErrorModal");
  mensajeEl.textContent = mensaje;

  const modalError = new bootstrap.Modal(document.getElementById("modalError"), {});
  modalError.show();
}
