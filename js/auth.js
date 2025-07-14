// JavaScript Document
// auth.js

// Verifica si hay sesión activa; si no, redirige al login
function validarSesion(ruta = "") {
  const usuario = sessionStorage.getItem("usuario");
  if (!usuario) {
    alert("Debes iniciar sesión primero.");
    window.location.href = ruta + "login.html";
  }
}

// Obtiene el usuario actual (ya parseado)
function obtenerUsuario() {
  const usuario = sessionStorage.getItem("usuario");
  return usuario ? JSON.parse(usuario) : null;
}

// Cierra sesión completamente
function cerrarSesion(ruta = "") {
  sessionStorage.removeItem("usuario");
  window.location.href = ruta + "login.html";
}

// Muestra opciones del menú según el rol del usuario
function configurarMenuPorRol() {
  const usuario = obtenerUsuario();
  if (!usuario) return;

  const rol = usuario.rol;

  // Mostrar nombre en el menú (si hay un contenedor para ello)
  const nombreElemento = document.querySelector(".dropdown strong");
  if (nombreElemento) {
    nombreElemento.textContent = usuario.nombre;
  }

  // Mostrar u ocultar elementos por clase
  if (rol === "Administrador") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "block");
    document.querySelectorAll(".user-only").forEach(el => el.style.display = "none");
  } else {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
    document.querySelectorAll(".user-only").forEach(el => el.style.display = "block");
  }
}

// Verifica si el usuario tiene rol de Administrador
function soloAdministrador(rutaRedireccion = "login.html") {
  const usuario = obtenerUsuario();

  if (!usuario || usuario.rol !== "Administrador") {
    alert("Acceso denegado. Esta página es solo para administradores.");
    window.location.href = rutaRedireccion;
  }
}

// Si ya hay sesión iniciada, redirige según el rol
function redirigirSiYaEstaLogueado() {
  const usuario = obtenerUsuario();

  if (usuario) {
    if (usuario.rol === "Administrador") {
      window.location.href = "Administrador/NodosIoT.htm";
    } else {
      window.location.href = "monitoreo.htm";
    }
  }
}


// Reemplaza los botones de login/registro por el menú de usuario si está logueado
function mostrarMenuUsuarioSiLogueado() {
  const usuario = obtenerUsuario();
  const contenedor = document.getElementById("contenedor-login");

  if (usuario && contenedor) {
    contenedor.innerHTML = `
      <div class="dropdown border bd-indigo-300 rounded p-2">
        <a href="#" class="d-flex align-items-center text-black text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="imgs/user.jpg" alt="" width="32" height="32" class="rounded-circle me-2">
          <strong id="nombre-usuario">${usuario.nombre}</strong>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark text-small shadow">
          <li><a class="dropdown-item" href="php/perfil.htm">Perfil</a></li>
          <li><hr class="dropdown-divider"></li>
		  <li><a class="dropdown-item" href="php/monitoreo.htm">Monitoreos</a></li>
          <li><hr class="dropdown-divider"></li>
		  <li><a class="dropdown-item" href="php/Metricas.htm">Historial</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a onclick="cerrarSesion()" class="dropdown-item" href="#">Cerrar sesión</a></li>
        </ul>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(sessionStorage.getItem("usuario"));
  if (!user) return;

  const avatarImg = document.querySelector('img.rounded-circle');
  if (avatarImg) {
    if (user.rol === 'Administrador') {
      avatarImg.src = "../imgs/perfil admin.png";
      avatarImg.alt = "Administrador";
    } else {
      avatarImg.src = "../imgs/user.jpg";
      avatarImg.alt = "Usuario";
    }
  }
});
