// JavaScript Document
// Función para cerrar todas las modales activas (para evitar solapamientos)
function cerrarTodasLasModales() {
  const modalesActivas = document.querySelectorAll('.modal.show');
  modalesActivas.forEach(modal => {
    const instancia = bootstrap.Modal.getInstance(modal);
    if (instancia) instancia.hide();
  });
}

document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  const email = document.getElementById("floatingInput").value.trim();
  const password = document.getElementById("floatingPassword").value;

  // Mostrar modal de carga
  const modalCarga = new bootstrap.Modal(document.getElementById('modalCargando'));
  modalCarga.show();

  try {
    const proxyUrl = "";
    const apiUrl = "https://smma-aobk.onrender.com/api/USUARIOS";

    const response = await fetch(proxyUrl + apiUrl, {
      headers: {
        'Origin': 'http://localhost',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      throw new Error("Error al conectar con la API");
    }

    const users = await response.json();
    const user = users.find(u => u.correo === email && u.contrasena === password);

    if (user) {
      // Guardar datos en sessionStorage
      sessionStorage.setItem("usuario", JSON.stringify({
        matricula: user.matricula,
        nombre: user.nombre,
        rol: user.Rol,
        correo: user.correo
      }));

      cerrarTodasLasModales();

      setTimeout(() => {
        document.getElementById("mensajeBienvenida").textContent =
          `Hola ${user.nombre}, tu rol es ${user.Rol}. ¡Nos alegra verte!`;

        const modalBienvenida = new bootstrap.Modal(document.getElementById('modalBienvenida'));
        modalBienvenida.show();

        document.getElementById("btnEntrar").onclick = function() {
          if (user.Rol === "Administrador") {
            window.location.href = "Administrador/NodosIoT.htm";
          } else {
            window.location.href = "monitoreo.htm";
          }
        };
      }, 300); // Espera a que se cierre bien la modal anterior

    } else {
      cerrarTodasLasModales();

      setTimeout(() => {
        const modalError = new bootstrap.Modal(document.getElementById('modalError'));
        modalError.show();
      }, 300);
    }

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    cerrarTodasLasModales();
    alert("Ocurrió un error al iniciar sesión. Intenta más tarde.");
  }
});