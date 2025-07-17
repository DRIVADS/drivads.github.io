// JavaScript Document
  const proxy = "";
  const apiUsuarios = "https://smma-aobk.onrender.com/api/usuarios";
  let usuariosData = [];
  let matriculaAEliminar = null;
  let matriculaParaAdmin = null;

  // Mostrar/ocultar overlay de carga
  function mostrarLoading(mostrar) {
    const cargando = document.getElementById('cargando-main');
    if (cargando) {
      cargando.style.display = mostrar ? 'flex' : 'none';
    }
  }

  // Obtener usuarios desde la API
  async function obtenerUsuarios() {
    mostrarLoading(true);
    try {
      const res = await fetch(proxy + apiUsuarios);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      usuariosData = await res.json();
      mostrarUsuarios(usuariosData);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      mostrarAlerta("No se pudieron cargar los datos de usuarios.", "danger");
    } finally {
      mostrarLoading(false);
    }
  }

  // Mostrar tabla de usuarios
  function mostrarUsuarios(lista) {
    const tbody = document.getElementById('usuariosBody');
    tbody.innerHTML = lista.map(usuario => {
      const nombre = `${usuario.nombre || ''} ${usuario.apellido_pa || ''} ${usuario.apellido_ma || ''}`.trim();
      return `
        <tr>
          <td>${nombre}</td>
          <td>${usuario.fechaNacimiento || 'N/A'}</td>
          <td>${usuario.Rol || 'N/A'}</td>
          <td>${usuario.correo || 'N/A'}</td>
          <td>${usuario.institucion || 'N/A'}</td>
          <td>${usuario.cargo || 'N/A'}</td>
          <td>${usuario.matricula || 'N/A'}</td>
          <td>
            <button class="btn btn-danger btn-sm col-12 mb-1" onclick="confirmarEliminacion('${usuario.matricula}')">Eliminar</button>
            <button class="btn btn-info btn-sm col-12" onclick="confirmarAdmin('${usuario.matricula}')">Administrador</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Normalizar texto para búsqueda
  const normalizar = txt => txt?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";

  // Filtrar usuarios por nombre completo
  function filtrarUsuariosPorNombre(valor) {
    const texto = normalizar(valor);
    const filtrados = usuariosData.filter(u => {
      const nombreCompleto = `${u.nombre || ''} ${u.apellido_pa || ''} ${u.apellido_ma || ''}`;
      return normalizar(nombreCompleto).includes(texto);
    });
    mostrarUsuarios(filtrados);
  }

  // Confirmar eliminación con modal
  function confirmarEliminacion(matricula) {
    matriculaAEliminar = matricula;
    new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
  }

  document.getElementById('btnEliminarConfirmado').addEventListener('click', async () => {
    if (!matriculaAEliminar) return;
    mostrarLoading(true);
    try {
      const res = await fetch(proxy + `${apiUsuarios}/${matriculaAEliminar}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      mostrarAlerta("Usuario eliminado correctamente.", "success");
      await obtenerUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      mostrarAlerta("Error al eliminar usuario.", "danger");
    } finally {
      bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar')).hide();
      matriculaAEliminar = null;
      mostrarLoading(false);
    }
  });

  // Confirmar asignación de administrador con modal
  function confirmarAdmin(matricula) {
    matriculaParaAdmin = matricula;
    new bootstrap.Modal(document.getElementById('modalConfirmarAdmin')).show();
  }

  document.getElementById('btnAdminConfirmado').addEventListener('click', async () => {
    if (!matriculaParaAdmin) return;
    mostrarLoading(true);
    try {
      const usuario = usuariosData.find(u => u.matricula === matriculaParaAdmin);
      if (!usuario) throw new Error("Usuario no encontrado");

      const usuarioActualizado = {
        ...usuario,
        Rol: "Administrador"
      };

      const res = await fetch(proxy + `${apiUsuarios}/${matriculaParaAdmin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioActualizado)
      });

      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      mostrarAlerta("Usuario ahora es Administrador.", "info");
      await obtenerUsuarios();
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      mostrarAlerta("Error al asignar rol de Administrador.", "danger");
    } finally {
      bootstrap.Modal.getInstance(document.getElementById('modalConfirmarAdmin')).hide();
      matriculaParaAdmin = null;
      mostrarLoading(false);
    }
  });

  // Mostrar alertas reutilizables
  function mostrarAlerta(mensaje, tipo = 'info') {
    const alertId = `alert-${Date.now()}`;
    const alertHTML = `
      <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>`;
    document.getElementById('alertContainer').insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(() => {
      const alertEl = document.getElementById(alertId);
      if (alertEl) alertEl.remove();
    }, 4000);
  }

  // Filtrado en vivo por input nombre
  document.getElementById('nombre').addEventListener('input', e => {
    filtrarUsuariosPorNombre(e.target.value);
  });

  // Inicializar al cargar la página
  obtenerUsuarios();
