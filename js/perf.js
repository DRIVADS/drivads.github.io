// JavaScript Document
// Variables comunes y usuario activo
const proxyUrl = "";
const apiBase = "https://smma-aobk.onrender.com/api";
const user = JSON.parse(sessionStorage.getItem("usuario"));

if (!user) {
  alert("Sesión no válida. Vuelve a iniciar sesión.");
  window.location.href = "login.html";
}

const apiUsuarioURL = `${proxyUrl}${apiBase}/usuarios/${user.matricula}`;
const apiUsuariosURL = `${proxyUrl}${apiBase}/USUARIOS`;

// Mostrar nombre y rol
const nombreEl = document.getElementById('nombreUsuario');
const rolEl = document.getElementById('rolUsuario');
if (nombreEl) nombreEl.textContent = user.nombre || '';
if (rolEl) rolEl.textContent = user.rol || '';

function formatearFecha(fecha) {
  if (!fecha.includes('/')) return fecha;
  const [yyyy, mm, dd] = fecha.split('/');
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

async function cargarUsuario() {
  try {
    const resp = await fetch(apiUsuarioURL);
    const usuario = await resp.json();

    const campos = {
      firstName: usuario.nombre,
      apellidoPa: usuario.apellido_pa,
      apellidoMa: usuario.apellido_ma,
      fecha: formatearFecha(usuario.fechaNacimiento || ''),
      institucion: usuario.institucion,
      cargo: usuario.cargo,
      email: usuario.correo
    };

    for (const id in campos) {
      const input = document.getElementById(id);
      if (input) input.value = campos[id] || '';
    }
  } catch (error) {
    console.error("Error al cargar usuario:", error);
    alert("No se pudieron cargar los datos del usuario.");
  }
}

async function obtenerUsuarioDesdeAPI() {
  const resp = await fetch(apiUsuariosURL, {
    headers: {
      'Origin': 'http://localhost',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const usuarios = await resp.json();
  return usuarios.find(u => u.matricula === user.matricula);
}

async function enviarFormulario(event) {
  event.preventDefault();
  const form = this;
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const datosActualizados = {
    nombre: document.getElementById('firstName').value,
    apellido_pa: document.getElementById('apellidoPa').value,
    apellido_ma: document.getElementById('apellidoMa').value,
    fechaNacimiento: document.getElementById('fecha').value,
    institucion: document.getElementById('institucion').value,
    cargo: document.getElementById('cargo').value
  };

  try {
    const resp = await fetch(apiUsuarioURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosActualizados)
    });

    if (!resp.ok) throw new Error();
    alert("Datos actualizados correctamente");
  } catch (error) {
    console.error("Error al actualizar:", error);
    alert("Hubo un error al guardar los datos.");
  }
}

function inicializarValidacionBootstrap() {
  const forms = document.querySelectorAll('.needs-validation');
  forms.forEach(form => {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
}

async function eliminarCuenta() {
  const password = document.getElementById('confirmPassword').value.trim();
  const errorDiv = document.getElementById('errorEliminar');
  if (!password) {
    errorDiv.textContent = "La contraseña es obligatoria.";
    errorDiv.classList.remove('d-none');
    return;
  }

  try {
    const usuarioReal = await obtenerUsuarioDesdeAPI();
    if (!usuarioReal || usuarioReal.contrasena !== password) {
      errorDiv.textContent = "Contraseña incorrecta.";
      errorDiv.classList.remove('d-none');
      return;
    }

    const deleteResp = await fetch(apiUsuarioURL, { method: 'DELETE' });
    if (!deleteResp.ok) throw new Error();

    alert("Cuenta eliminada correctamente.");
    sessionStorage.clear();
    window.location.href = "login.html";

  } catch (error) {
    errorDiv.textContent = "Error al eliminar cuenta. Intenta de nuevo.";
    errorDiv.classList.remove('d-none');
    console.error("Error al eliminar cuenta:", error);
  }
}

async function cambiarContrasena(event) {
  event.preventDefault();

  const actual = document.getElementById("contrasenaActual").value.trim();
  const nueva = document.getElementById("nuevaContrasena").value.trim();
  const confirmar = document.getElementById("confirmarContrasena").value.trim();
  const errorDiv = document.getElementById("errorCambio");
  errorDiv.classList.add('d-none');

  if (!actual || !nueva || !confirmar) {
    errorDiv.textContent = "Todos los campos son obligatorios.";
    errorDiv.classList.remove('d-none');
    return;
  }

  if (nueva.length < 6) {
    errorDiv.textContent = "La nueva contraseña debe tener al menos 6 caracteres.";
    errorDiv.classList.remove('d-none');
    return;
  }

  if (nueva !== confirmar) {
    errorDiv.textContent = "Las nuevas contraseñas no coinciden.";
    errorDiv.classList.remove('d-none');
    return;
  }

  try {
    const usuarioReal = await obtenerUsuarioDesdeAPI();
    if (!usuarioReal || usuarioReal.contrasena !== actual) {
      errorDiv.textContent = "La contraseña actual es incorrecta.";
      errorDiv.classList.remove('d-none');
      return;
    }

    const updateResp = await fetch(apiUsuarioURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrasena: nueva })
    });

    if (!updateResp.ok) throw new Error();

    alert("Contraseña actualizada con éxito");
    bootstrap.Modal.getInstance(document.getElementById('modalCambiarContrasena')).hide();

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    errorDiv.textContent = "Ocurrió un error al cambiar la contraseña.";
    errorDiv.classList.remove('d-none');
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  cargarUsuario();
  inicializarValidacionBootstrap();
  const formActualizar = document.getElementById('formActualizar');
  if (formActualizar) formActualizar.addEventListener('submit', enviarFormulario);
  const btnEliminar = document.getElementById('btnEliminarConfirmado');
  if (btnEliminar) btnEliminar.addEventListener('click', eliminarCuenta);
  const formContrasena = document.getElementById("formCambiarContrasena");
  if (formContrasena) formContrasena.addEventListener("submit", cambiarContrasena);
});