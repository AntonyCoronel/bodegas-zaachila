(function(){
  'use strict';
  const STORAGE_KEY = 'bodegas_zaachila_v3_4_bodegas';
  const LEGACY_KEY = 'bodegas_zaachila_v2_data';

  function defaultData(){
    return {
      empresa: {
        nombre: 'Bodegas Seguras Zaachila',
        telefono: '+52 951 461 6417',
        correo: 'Por confirmar',
        direccion: 'La Soledad, 71313 Villa de Zaachila, Oaxaca (verificar ubicación)'
      },
      bodegas: [
        {
          id:1, codigo:'BOD-001', nombre:'Bodega Mini', slug:'mini', volumen:3, precio:499,
          estado:'Disponible', cliente:null, imagen:'assets/images/bodega-mini.png', etiqueta:'Ideal para archivos',
          descripcion:'Un espacio compacto para resguardar documentos, cajas y pertenencias personales.',
          capacidad:'Documentos, maletas y aproximadamente 15 a 25 cajas pequeñas.',
          dimensiones:'Referencia: 1.5 × 1 × 2 m (ancho × fondo × alto)',
          acceso:'Acceso al espacio sujeto a los horarios y condiciones del servicio.',
          contenido:['Documentos y archivos','Cajas pequeñas de mudanza','Maletas y ropa de temporada','Herramientas y decoración ligera'],
          caracteristicas:['Espacio compacto','Organización para archivo personal','Almacenamiento flexible','Protección mediante candado'],
          disponibleDesde:'Inmediata'
        },
        {
          id:2, codigo:'BOD-002', nombre:'Bodega Mediana', slug:'mediana', volumen:6, precio:899,
          estado:'Reservada', cliente:{nombre:'Ana Martínez (demo)',telefono:'951 000 0002',correo:'ana@example.com'},
          imagen:'assets/images/bodega-mediana.png', etiqueta:'La más versátil',
          descripcion:'Ideal para guardar muebles pequeños, bicicletas y artículos durante una mudanza.',
          capacidad:'Cajas medianas, bicicleta y mobiliario ligero de una habitación.',
          dimensiones:'Referencia: 2 × 1.5 × 2 m (ancho × fondo × alto)',
          acceso:'Acceso de clientes conforme a políticas de seguridad.',
          contenido:['Bicicleta y accesorios','Muebles ligeros','Contenedores y cajas de mudanza','Equipo deportivo y herramientas'],
          caracteristicas:['Distribución versátil','Espacio para mudanza parcial','Organización por estantes','Área techada y cerrada'],
          disponibleDesde:'No disponible'
        },
        {
          id:3, codigo:'BOD-003', nombre:'Bodega Comercial', slug:'comercial', volumen:7, precio:1199,
          estado:'Ocupada', cliente:{nombre:'Comercial Oaxaca (demo)',telefono:'951 000 0003',correo:'comercial@example.com'},
          imagen:'assets/images/bodega-comercial.png', etiqueta:'Para negocios',
          descripcion:'Bodega para inventario pequeño de comercios, insumos y productos empaquetados.',
          capacidad:'Estanterías, cajas de productos y material comercial no peligroso.',
          dimensiones:'Referencia: 2 × 1.75 × 2 m (ancho × fondo × alto)',
          acceso:'Acceso sujeto a autorización y horarios de la instalación.',
          contenido:['Productos empaquetados','Estanterías y cajas de inventario','Equipo ligero de oficina','Material de distribución'],
          caracteristicas:['Pensada para inventario','Espacio para estanterías','Posibilidad de organizar por categorías','Almacenamiento comercial'],
          disponibleDesde:'No disponible'
        },
        {
          id:4, codigo:'BOD-004', nombre:'Bodega Familiar', slug:'familiar', volumen:12, precio:1799,
          estado:'Disponible', cliente:null, imagen:'assets/images/bodega-familiar.webp', etiqueta:'Mayor capacidad',
          descripcion:'Más espacio para cajas, muebles y artículos de una mudanza familiar.',
          capacidad:'Muebles de un departamento pequeño, maletas y varias cajas grandes.',
          dimensiones:'Referencia: 3 × 2 × 2 m (ancho × fondo × alto)',
          acceso:'Acceso a confirmar según condiciones del contrato.',
          contenido:['Sala pequeña o muebles desmontados','Cajas grandes de mudanza','Colchones y artículos de temporada','Electrodomésticos desconectados'],
          caracteristicas:['Mayor espacio para organización','Útil en mudanzas familiares','Almacenamiento temporal','Ideal para artículos voluminosos'],
          disponibleDesde:'Inmediata'
        }
      ],
      solicitudes: []
    };
  }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function normalize(data){
    const defaults=defaultData();
    if(!data || !Array.isArray(data.bodegas) || !Array.isArray(data.solicitudes)) return defaults;
    data.empresa = Object.assign({},defaults.empresa,data.empresa || {});
    const found=new Set();
    data.bodegas=data.bodegas.filter(unit=>{
      if(!unit || !Number.isInteger(Number(unit.id)) || found.has(Number(unit.id))) return false;
      found.add(Number(unit.id));return true;
    }).map(unit=>{
      const base=defaults.bodegas.find(b=>b.id===Number(unit.id));
      const merged=Object.assign({},base||{},unit);
      merged.codigo=merged.codigo || 'BOD-'+String(merged.id).padStart(3,'0');
      if(!['Disponible','Reservada','Ocupada'].includes(merged.estado)) merged.estado='Disponible';
      if(merged.estado==='Disponible') merged.cliente=null;
      else merged.cliente=(merged.cliente && merged.cliente.nombre)?merged.cliente:null;
      merged.disponibleDesde=merged.estado==='Disponible'?'Inmediata':'No disponible';
      return merged;
    });
    defaults.bodegas.forEach(b=>{if(!found.has(b.id))data.bodegas.push(b)});
    data.bodegas.sort((a,b)=>a.id-b.id);
    return data;
  }
  function loadData(){
    let raw;
    try {
      raw=localStorage.getItem(STORAGE_KEY);
      if(raw===null){raw=localStorage.getItem(LEGACY_KEY)}
      const data=raw?normalize(JSON.parse(raw)):defaultData();
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
      return data;
    } catch(e){ return defaultData(); }
  }
  function saveData(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(normalize(data)))}
  function resetData(){const data=defaultData(); saveData(data);return data}
  function getBodegaById(id,data){return (data||loadData()).bodegas.find(b=>Number(b.id)===Number(id))}
  function createRequest(payload){
    const data=loadData();const unit=getBodegaById(payload.bodegaId,data);
    if(!unit || unit.estado!=='Disponible')throw Error('Bodega no disponible para cotización');
    if(!String(payload.nombre||'').trim()||!String(payload.telefono||'').trim()||!String(payload.correo||'').trim())throw Error('Faltan datos de contacto');
    const id=Math.max(0,...data.solicitudes.map(s=>Number(s.id)||0))+1;
    const request={id,bodegaId:unit.id,nombre:String(payload.nombre).trim(),telefono:String(payload.telefono).trim(),correo:String(payload.correo).trim(),mensaje:String(payload.mensaje||'').trim(),fecha:new Date().toLocaleDateString('en-CA'),estado:'Pendiente'};
    data.solicitudes.unshift(request);saveData(data);return request;
  }
  function updateBodega(id,payload){
    const data=loadData();const item=getBodegaById(id,data);if(!item)return null;
    if(!['Disponible','Reservada','Ocupada'].includes(payload.estado))throw Error('Estado inválido');
    if(!Number.isFinite(Number(payload.precio)) || Number(payload.precio)<0 || !Number.isFinite(Number(payload.volumen)) || Number(payload.volumen)<=0)throw Error('Precio o capacidad inválidos');
    if(payload.estado!=='Disponible' && !String(payload.cliente?.nombre||'').trim())throw Error('Asigna un cliente a la bodega reservada u ocupada');
    item.nombre=String(payload.nombre).trim();item.volumen=Number(payload.volumen);item.precio=Number(payload.precio);item.estado=payload.estado;
    item.descripcion=String(payload.descripcion).trim();
    item.cliente=payload.estado==='Disponible'?null:{nombre:String(payload.cliente.nombre).trim(),telefono:String(payload.cliente.telefono||'').trim(),correo:String(payload.cliente.correo||'').trim()};
    item.disponibleDesde=payload.estado==='Disponible'?'Inmediata':'No disponible';
    saveData(data);return item;
  }
  function updateSolicitud(id,estado){
    if(!['Pendiente','Contactado','Cerrado'].includes(estado))throw Error('Estado inválido');
    const data=loadData();const request=data.solicitudes.find(s=>Number(s.id)===Number(id));if(!request)return null;
    request.estado=estado;saveData(data);return request;
  }
  window.BodegasApp={STORAGE_KEY,defaultData,loadData,saveData,resetData,getBodegaById,createRequest,updateBodega,updateSolicitud};
})();
