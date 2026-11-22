(function(){
  const app = window.BodegasApp;
  const data = app.loadData();
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id') || 1);
  const bodega = app.getBodegaById(id, data);
  const container = document.getElementById('detailContainer');
  const toastNode = document.getElementById('toast');

  function money(value){
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
  }
  function escapeHtml(text){
    return String(text).replace(/[&<>"']/g, function(char){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char];
    });
  }
  function statusClass(estado){
    return estado === 'Disponible' ? 'status-disponible' : estado === 'Reservada' ? 'status-reservada' : 'status-ocupada';
  }
  function toast(message){
    toastNode.textContent = message;
    toastNode.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function(){ toastNode.classList.remove('show'); }, 2800);
  }

  if(!bodega){
    container.innerHTML = '<div class="empty-state"><h2>Bodega no encontrada</h2><p>La bodega solicitada no existe. Regresa al catálogo para seleccionar una opción válida.</p><p><a class="btn btn-primary" href="index.html">Volver al catálogo</a></p></div>';
    return;
  }

  container.innerHTML = [
    '<div class="breadcrumbs"><a href="index.html">Inicio</a> / Bodegas / ' + escapeHtml(bodega.nombre) + '</div>',
    '<div class="detail-layout">',
      '<div class="detail-image"><img src="' + bodega.imagen + '" alt="' + escapeHtml(bodega.nombre) + '"><p class="gallery-note">Imagen generada para representar el contenido sugerido de esta bodega.</p></div>',
      '<article class="detail-panel metric-box">',
        '<span class="status-badge ' + statusClass(bodega.estado) + '">' + escapeHtml(bodega.estado) + '</span>',
        '<h1>' + escapeHtml(bodega.nombre) + '</h1>',
        '<p><strong>Identificador:</strong> ' + escapeHtml(bodega.codigo) + '</p>',
        '<p>' + escapeHtml(bodega.descripcion) + '</p>',
        '<div class="detail-price">' + money(bodega.precio) + ' <small style="font-size:1rem;color:var(--muted);font-weight:700">/ mes</small></div>',
        '<div class="highlight-grid">',
          '<div class="highlight-box"><small>Volumen</small><strong>' + bodega.volumen + ' m³</strong></div>',
          '<div class="highlight-box"><small>Capacidad</small><strong>' + escapeHtml(bodega.capacidad) + '</strong></div>',
          '<div class="highlight-box"><small>Disponibilidad</small><strong>' + escapeHtml(bodega.disponibleDesde) + '</strong></div>',
        '</div>',
        '<div class="card-actions" style="margin-top:24px">',
          '<a class="btn btn-secondary" href="index.html#bodegas">Volver a bodegas</a>',
          bodega.estado === 'Disponible' ? '<a id="solicitarDetalle" class="btn btn-primary" href="index.html?bodega=' + bodega.id + '#cotizacion">Solicitar cotización</a>' : '<span class="status-badge ' + statusClass(bodega.estado) + '">No disponible para rentar</span>',
        '</div>',
      '</article>',
    '</div>',
    '<section class="section" style="padding-bottom:0">',
      '<div class="dual-grid">',
        '<article class="info-box">',
          '<h3>Contenido recomendado</h3>',
          '<ul class="bullet-list">' + bodega.contenido.map(function(item){ return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>',
        '</article>',
        '<article class="info-box">',
          '<h3>Características de la bodega</h3>',
          '<ul class="bullet-list">' + bodega.caracteristicas.map(function(item){ return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>',
        '</article>',
      '</div>',
    '</section>',
    '<section class="section" style="padding-top:24px">',
      '<div class="dual-grid">',
        '<article class="info-box">',
          '<h3>Datos técnicos</h3>',
          '<p><strong>Dimensiones sugeridas:</strong> ' + escapeHtml(bodega.dimensiones) + '</p>',
          '<p><strong>Acceso:</strong> ' + escapeHtml(bodega.acceso) + '</p>',
          '<p><strong>Estado actual:</strong> ' + escapeHtml(bodega.estado) + '</p>',
        '</article>',
        '<article class="info-box">',
          '<h3>Cómo defender tu entrega</h3>',
          '<p>Esta es la vista interior ilustrativa de la bodega. No habilita el acceso físico al almacén.</p>',
          '<p>La disponibilidad se administra desde el dashboard. Los datos del cliente asignado no se publican en esta ficha.</p>',
        '</article>',
      '</div>',
    '</section>'
  ].join('');

})();
