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