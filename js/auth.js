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
function cerrarSesion() {
  sessionStorage.removeItem("usuario");
  window.location.href = "php/login.html";
}