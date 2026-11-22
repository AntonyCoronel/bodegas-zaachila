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
  const toast = function(message){
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function(){ node.classList.remove('show'); }, 2800);
  };
  const statusClass = function(estado){
    return estado === 'Disponible' ? 'status-disponible' : estado === 'Reservada' ? 'status-reservada' : 'status-ocupada';
  };

  function refresh(){
    data = app.loadData();
    renderCards();
    renderAvailability();
    renderRecentRequests();
    renderBodegasTable();
    renderSolicitudesTable();
  }

  function renderCards(){
    const disponibles = data.bodegas.filter(function(item){ return item.estado === 'Disponible'; }).length;
    const reservadas = data.bodegas.filter(function(item){ return item.estado === 'Reservada'; }).length;
    const ocupadas = data.bodegas.filter(function(item){ return item.estado === 'Ocupada'; }).length;
    const ingreso = data.bodegas.filter(function(item){ return item.estado === 'Ocupada'; }).reduce(function(acc, item){ return acc + item.precio; }, 0);

    $('#dashboardCards').innerHTML = [
      { label: 'Bodegas registradas', value: data.bodegas.length },
      { label: 'Disponibles', value: disponibles },
      { label: 'Reservadas / ocupadas', value: reservadas + ocupadas },
      { label: 'Renta mensual estimada*', value: money(ingreso) }
    ].map(function(item){
      return '<article class="dashboard-card"><small>' + item.label + '</small><strong>' + item.value + '</strong></article>';
    }).join('');
  }

  function renderAvailability(){
    const total = data.bodegas.length || 1;
    const estados = ['Disponible', 'Reservada', 'Ocupada'];
    $('#availabilityList').innerHTML = estados.map(function(estado){
      const cantidad = data.bodegas.filter(function(item){ return item.estado === estado; }).length;
      const width = Math.round((cantidad / total) * 100);
      return [
        '<div class="availability-row">',
          '<strong>' + estado + '</strong>',
          '<div class="progress"><span style="width:' + width + '%"></span></div>',
          '<span>' + cantidad + '</span>',
        '</div>'
      ].join('');
    }).join('');
  }

  function renderRecentRequests(){
    const target = $('#recentRequests');
    if(!data.solicitudes.length){
      target.innerHTML = '<div class="empty-state">Aún no hay solicitudes.</div>';
      return;
    }
    target.innerHTML = data.solicitudes.slice(0,4).map(function(item){
      const bodega = data.bodegas.find(function(unit){ return Number(unit.id) === Number(item.bodegaId); });
      return [
        '<article class="request-card">',
          '<h4>' + escapeHtml(item.nombre) + '</h4>',
          '<p><strong>Bodega:</strong> ' + escapeHtml(bodega ? bodega.nombre : 'Sin referencia') + '</p>',
          '<p><strong>Mensaje:</strong> ' + escapeHtml(item.mensaje) + '</p>',
          '<p><strong>Estado:</strong> ' + escapeHtml(item.estado) + '</p>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderBodegasTable(){
    $('#bodegasTable').innerHTML = data.bodegas.map(function(item){
      return [
        '<tr>',
          '<td><strong>' + escapeHtml(item.codigo) + ' · ' + escapeHtml(item.nombre) + '</strong><br><span style="color:var(--muted)">' + escapeHtml(item.descripcion) + '</span></td>',
          '<td>' + item.volumen + ' m³</td>',
          '<td>' + money(item.precio) + '</td>',
          '<td><span class="status-badge ' + statusClass(item.estado) + '">' + escapeHtml(item.estado) + '</span></td>',
          '<td>' + escapeHtml(item.capacidad) + '</td>',
          '<td>' + (item.cliente?.nombre ? '<strong>' + escapeHtml(item.cliente.nombre) + '</strong><br><small>' + escapeHtml(item.cliente.telefono || 'Sin teléfono') + '</small>' : '<span style="color:var(--muted)">Sin cliente</span>') + '</td>',
          '<td>',
            '<div class="inline-actions">',
              '<button class="small-btn edit-btn" data-id="' + item.id + '">Editar</button>',
              '<a class="small-btn secondary" href="bodega.html?id=' + item.id + '">Ver</a>',
            '</div>',
          '</td>',
        '</tr>'
      ].join('');
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(function(button){
      button.addEventListener('click', function(){
        openModal(Number(button.getAttribute('data-id')));
      });
    });
  }

  function renderSolicitudesTable(){
    const tbody = $('#solicitudesTable');
    if(!data.solicitudes.length){
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">Sin solicitudes registradas.</div></td></tr>';
      return;
    }

    tbody.innerHTML = data.solicitudes.map(function(item){
      const bodega = data.bodegas.find(function(unit){ return Number(unit.id) === Number(item.bodegaId); });
      return [
        '<tr>',
          '<td><strong>' + escapeHtml(item.nombre) + '</strong><br><span style="color:var(--muted)">' + escapeHtml(item.mensaje) + '</span></td>',
          '<td>' + escapeHtml(bodega ? bodega.nombre : 'Sin referencia') + '</td>',
          '<td>' + escapeHtml(item.telefono) + '<br>' + escapeHtml(item.correo) + '</td>',
          '<td>' + escapeHtml(item.fecha) + '</td>',
          '<td>',
            '<select class="request-status" data-id="' + item.id + '">',
              '<option ' + (item.estado === 'Pendiente' ? 'selected' : '') + '>Pendiente</option>',
              '<option ' + (item.estado === 'Contactado' ? 'selected' : '') + '>Contactado</option>',
              '<option ' + (item.estado === 'Cerrado' ? 'selected' : '') + '>Cerrado</option>',
            '</select>',
          '</td>',
        '</tr>'
      ].join('');
    }).join('');

    document.querySelectorAll('.request-status').forEach(function(select){
      select.addEventListener('change', function(){
        app.updateSolicitud(Number(select.getAttribute('data-id')), select.value);
        refresh();
        toast('Estado de solicitud actualizado.');
      });
    });
  }

  function openModal(id){
    const unit = data.bodegas.find(function(item){ return Number(item.id) === Number(id); });
    if(!unit) return;
    const modal = $('#editModal');
    const form = $('#editForm');
    form.elements['id'].value = unit.id;
    form.elements['nombre'].value = unit.nombre;
    form.elements['volumen'].value = unit.volumen;
    form.elements['precio'].value = unit.precio;
    form.elements['estado'].value = unit.estado;
    form.elements['descripcion'].value = unit.descripcion;
    form.elements['clienteNombre'].value = unit.cliente?.nombre || '';
    form.elements['clienteTelefono'].value = unit.cliente?.telefono || '';
    form.elements['clienteCorreo'].value = unit.cliente?.correo || '';
    syncClienteFields();
    modal.classList.add('show');
  }

  function closeModal(){
    $('#editModal').classList.remove('show');
  }

  function syncClienteFields(){
    const form=$('#editForm'); const libre=form.elements['estado'].value==='Disponible';
    for(const name of ['clienteNombre','clienteTelefono','clienteCorreo']) {form.elements[name].disabled=libre;}
    form.elements['clienteNombre'].required=!libre;
    $('#clienteAyuda').textContent=libre?'Esta bodega está disponible y no tiene cliente. Si cambias a Reservada u Ocupada, asigna un cliente.':'Escribe el nombre del cliente que tiene reservada u ocupada esta bodega.';
  }
  $('#editForm').elements['estado'].addEventListener('change',syncClienteFields);
  $('#editForm').addEventListener('submit', function(event){
    event.preventDefault();
    const form = event.currentTarget;
    try{ app.updateBodega(Number(form.elements['id'].value), {
      nombre: form.elements['nombre'].value.trim(),
      volumen: Number(form.elements['volumen'].value),
      precio: Number(form.elements['precio'].value),
      estado: form.elements['estado'].value,
      descripcion: form.elements['descripcion'].value.trim(),
      cliente: form.elements['estado'].value === 'Disponible' ? null : {
        nombre:form.elements['clienteNombre'].value.trim(),
        telefono:form.elements['clienteTelefono'].value.trim(),
        correo:form.elements['clienteCorreo'].value.trim()
      }
    }); }catch(e){toast(e.message);return;}
    closeModal();
    refresh();
    toast('Bodega actualizada correctamente.');
  });

  $('#closeModal').addEventListener('click', closeModal);
  $('#cancelModal').addEventListener('click', closeModal);
  $('#editModal').addEventListener('click', function(event){
    if(event.target.id === 'editModal') closeModal();
  });
  $('#resetData').addEventListener('click', function(){
    if(window.confirm('¿Restaurar los datos de demostración?')){
      app.resetData();
      refresh();
      toast('Datos restaurados.');
    }
  });

  window.addEventListener('storage',refresh);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
  refresh();
})();
