(function(){
  const app = window.BodegasApp;
  let data = app.loadData();

  const $ = function(selector){ return document.querySelector(selector); };
  const money = function(value){ return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value); };
  const escapeHtml = function(text){
    return String(text).replace(/[&<>"']/g, function(char){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char];
    });
  };
  const statusClass = function(estado){
    return estado === 'Disponible' ? 'status-disponible' : estado === 'Reservada' ? 'status-reservada' : 'status-ocupada';
  };
  const toast = function(message){
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function(){ node.classList.remove('show'); }, 2800);
  };

  function renderQuickStats(){
    const total = data.bodegas.length;
    const disponibles = data.bodegas.filter(function(item){ return item.estado === 'Disponible'; }).length;
    const reservadas = data.bodegas.filter(function(item){ return item.estado === 'Reservada'; }).length;
    $('#quickStats').innerHTML = [
      '<div class="stat-card"><strong>' + total + '</strong><span>Bodegas creadas</span></div>',
      '<div class="stat-card"><strong>' + disponibles + '</strong><span>Disponibles hoy</span></div>',
      '<div class="stat-card"><strong>' + reservadas + '</strong><span>En reserva</span></div>'
    ].join('');
  }

  function renderMetrics(){
    const ocupadas = data.bodegas.filter(function(item){ return item.estado === 'Ocupada'; }).length;
    const precioPromedio = Math.round(data.bodegas.reduce(function(acc, item){ return acc + item.precio; }, 0) / data.bodegas.length);
    const solicitudes = data.solicitudes.length;
    $('#metricsGrid').innerHTML = [
      { label: 'Tamaños listos', value: data.bodegas.map(function(item){ return item.volumen + ' m³'; }).join(' · ') },
      { label: 'Precio promedio', value: money(precioPromedio) },
      { label: 'Solicitudes registradas', value: solicitudes },
      { label: 'Bodegas ocupadas', value: ocupadas }
    ].map(function(item){
      return '<article class="metric-box"><small>' + item.label + '</small><strong>' + item.value + '</strong></article>';
    }).join('');
  }

  function renderBodegas(){
    $('#bodegasGrid').innerHTML = data.bodegas.map(function(item){
      return [
        '<article class="warehouse-card">',
          '<img src="' + item.imagen + '" alt="' + escapeHtml(item.nombre) + '">',
          '<div class="warehouse-body">',
            '<div class="card-top">',
              '<span class="tag">' + escapeHtml(item.codigo) + ' · ' + escapeHtml(item.etiqueta) + '</span>',
              '<span class="status-badge ' + statusClass(item.estado) + '">' + escapeHtml(item.estado) + '</span>',
            '</div>',
            '<div>',
              '<h3 class="warehouse-title">' + escapeHtml(item.nombre) + ' · ' + item.volumen + ' m³</h3>',
              '<p class="warehouse-description">' + escapeHtml(item.descripcion) + '</p>',
            '</div>',
            '<div class="price-line">',
              '<div class="price">' + money(item.precio) + ' <small>/ mes</small></div>',
              '<span class="mini-badge">' + escapeHtml(item.disponibleDesde) + '</span>',
            '</div>',
            '<div class="capacity"><strong>Capacidad:</strong> ' + escapeHtml(item.capacidad) + '</div>',
            '<ul class="bullet-list">' + item.contenido.slice(0,3).map(function(point){ return '<li>' + escapeHtml(point) + '</li>'; }).join('') + '</ul>',
            '<div class="card-actions">',
              '<a class="btn btn-secondary" href="bodega.html?id=' + item.id + '">Ver interior</a>',
              '<button class="btn btn-primary cotizar-btn" data-id="' + item.id + '" ' + (item.estado !== 'Disponible' ? 'disabled' : '') + '>' + (item.estado === 'Disponible' ? 'Cotizar' : 'No disponible') + '</button>',
            '</div>',
          '</div>',
        '</article>'
      ].join('');
    }).join('');

    document.querySelectorAll('.cotizar-btn').forEach(function(button){
      button.addEventListener('click', function(){
        const id = button.getAttribute('data-id');
        $('#bodegaSelect').value = id;
        document.getElementById('cotizacion').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function renderContact(){
    $('#contactList').innerHTML = [
      '<li><strong>Teléfono</strong><br>' + escapeHtml(data.empresa.telefono) + '</li>',
      '<li><strong>Correo</strong><br>' + escapeHtml(data.empresa.correo) + '</li>',
      '<li><strong>Dirección</strong><br>' + escapeHtml(data.empresa.direccion) + '</li>'
    ].join('');

    $('#bodegaSelect').innerHTML = '<option value="">Selecciona una bodega</option>' + data.bodegas.map(function(item){
      return '<option value="' + item.id + '" ' + (item.estado !== 'Disponible' ? 'disabled' : '') + '>' + escapeHtml(item.nombre) + ' - ' + item.volumen + 'm³ (' + escapeHtml(item.estado) + ')</option>';
    }).join('');
  }

  function bindForm(){
    $('#contactForm').addEventListener('submit', function(event){
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const bodegaId = Number(formData.get('bodegaId'));
      const bodega = app.getBodegaById(bodegaId);
      if(!bodega){
        toast('Selecciona una bodega válida.');
        return;
      }
      if(bodega.estado !== 'Disponible'){
        toast('Esa bodega ya no está disponible por el momento.');
        return;
      }
      try { app.createRequest({
        bodegaId: bodegaId,
        nombre: String(formData.get('nombre')).trim(),
        telefono: String(formData.get('telefono')).trim(),
        correo: String(formData.get('correo')).trim(),
        mensaje: String(formData.get('mensaje')).trim()
      }); } catch(error) {toast(error.message);return;}
      form.reset();
      renderContact();
      toast('Solicitud registrada. Revísala en el dashboard.');
    });
  }

  renderQuickStats();
  renderMetrics();
  renderBodegas();
  renderContact();
  bindForm();
  const preselected = new URLSearchParams(window.location.search).get('bodega');
  if(preselected && app.getBodegaById(preselected)?.estado === 'Disponible') $('#bodegaSelect').value = preselected;
  window.addEventListener('storage',function(){data=app.loadData();renderQuickStats();renderMetrics();renderBodegas();renderContact();});
})();
