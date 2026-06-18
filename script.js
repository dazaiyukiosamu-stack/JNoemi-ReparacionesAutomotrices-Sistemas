(() => {
  'use strict';

  // ---- Claves de almacenamiento local (simulan la persistencia de la BD) ----
  const KEY_SEQ_CLIENTE = 'sigetra_seq_cliente';
  const KEY_SEQ_VEHICULO = 'sigetra_seq_vehiculo';
  const KEY_SEQ_TICKET = 'sigetra_seq_ticket';
  const KEY_REGISTROS = 'sigetra_registros';
  const MAX_VISIBLE_ROWS = 8;

  const form = document.getElementById('regForm');
  const recentBody = document.getElementById('recentBody');
  const emptyState = document.getElementById('emptyState');
  const ticketNoEl = document.getElementById('ticketNo');
  const heroTicketNoEl = document.getElementById('heroTicketNo');
  const toast = document.getElementById('toast');

  // ---- Utilidades de almacenamiento ----
  function getInt(key, fallback) {
    const v = parseInt(localStorage.getItem(key), 10);
    return Number.isNaN(v) ? fallback : v;
  }

  function getRegistros() {
    try {
      return JSON.parse(localStorage.getItem(KEY_REGISTROS)) || [];
    } catch (e) {
      return [];
    }
  }

  function pad(num) {
    return String(num).padStart(4, '0');
  }

  function nextTicketNumber() {
    return getInt(KEY_SEQ_TICKET, 0) + 1;
  }

  function refreshTicketDisplay() {
    const n = pad(nextTicketNumber());
    ticketNoEl.textContent = n;
    if (heroTicketNoEl) heroTicketNoEl.textContent = n;
  }

  // ---- Render de la tabla "registros recientes" ----
  function renderRecent() {
    const registros = getRegistros();
    recentBody.innerHTML = '';

    if (registros.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    registros.slice(0, MAX_VISIBLE_ROWS).forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${pad(r.ticket)}</td>
        <td>${escapeHtml(r.nombre)}</td>
        <td>${escapeHtml(r.marca)} ${escapeHtml(r.modelo)}</td>
        <td>${escapeHtml(r.placa)}</td>
        <td>${r.hora}</td>
        <td><span class="status-pill">Registrado</span></td>
      `;
      recentBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ---- Formateo en vivo: placa y VIN en mayúsculas ----
  const placaInput = document.getElementById('placa');
  const vinInput = document.getElementById('vin');

  placaInput.addEventListener('input', () => {
    const start = placaInput.selectionStart;
    placaInput.value = placaInput.value.toUpperCase();
    placaInput.setSelectionRange(start, start);
  });

  vinInput.addEventListener('input', () => {
    const start = vinInput.selectionStart;
    vinInput.value = vinInput.value.toUpperCase().replace(/\s/g, '');
    vinInput.setSelectionRange(start, start);
  });

  // ---- Teléfono: solo dígitos, formato boliviano 6/7 + 7 dígitos ----
  const telefonoInput = document.getElementById('telefono');
  telefonoInput.addEventListener('input', () => {
    telefonoInput.value = telefonoInput.value.replace(/\D/g, '').slice(0, 8);
  });

  function telefonoValido(valor) {
    return /^[67]\d{7}$/.test(valor);
  }

  // ---- Toast (simulación de envío de SMS, RN-03) ----
  let toastTimer = null;
  function mostrarToast(mensajeHtml) {
    clearTimeout(toastTimer);
    toast.innerHTML = mensajeHtml;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 6000);
  }

  // ---- Envío del formulario: simula INSERT en CLIENTE + VEHÍCULO ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = telefonoInput.value.trim();
    const correo = document.getElementById('correo').value.trim();
    const placa = placaInput.value.trim();
    const vin = vinInput.value.trim();
    const marca = document.getElementById('marca').value;
    const modelo = document.getElementById('modelo').value.trim();
    const anio = document.getElementById('anio').value.trim();
    const color = document.getElementById('color').value.trim();
    const motor = document.getElementById('motor').value.trim();

    if (!nombre || !telefono || !placa || !marca || !modelo || !anio) {
      form.reportValidity();
      return;
    }
    if (!telefonoValido(telefono)) {
      telefonoInput.focus();
      mostrarToast('<strong>Teléfono inválido.</strong> Debe tener 8 dígitos e iniciar con 6 o 7 (formato Bolivia).');
      return;
    }

    // Autoincremento simulado de claves primarias
    const idCliente = getInt(KEY_SEQ_CLIENTE, 0) + 1;
    const idVehiculo = getInt(KEY_SEQ_VEHICULO, 0) + 1;
    const ticket = getInt(KEY_SEQ_TICKET, 0) + 1;

    localStorage.setItem(KEY_SEQ_CLIENTE, idCliente);
    localStorage.setItem(KEY_SEQ_VEHICULO, idVehiculo);
    localStorage.setItem(KEY_SEQ_TICKET, ticket);

    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

    const registro = {
      ticket, idCliente, idVehiculo,
      nombre, telefono, correo,
      placa, vin, marca, modelo, anio, color, motor,
      hora
    };

    const registros = getRegistros();
    registros.unshift(registro);
    localStorage.setItem(KEY_REGISTROS, JSON.stringify(registros));

    renderRecent();
    refreshTicketDisplay();

    mostrarToast(
      `📲 <strong>SMS simulado</strong> a +591 ${telefono}: "Hemos registrado su ${escapeHtml(marca)} ${escapeHtml(modelo)} ` +
      `(placa ${escapeHtml(placa)}). Le avisaremos por SMS cuando el diagnóstico esté listo."`
    );

    form.reset();
    placaInput.focus();
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    setTimeout(() => form.reset(), 0);
  });

  // ---- Inicialización ----
  refreshTicketDisplay();
  renderRecent();
})();
