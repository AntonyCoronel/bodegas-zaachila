# Bodegas Seguras Zaachila — Cuatro espacios de alquiler

## Cómo abrir
Abre `index.html` para ver las cuatro tarjetas. Este HTML incluye CSS, JavaScript y fotografías incrustadas: incluso la vista previa de un único archivo debe mostrar las tarjetas y sus fotografías.

Selecciona **Ver interior** en una tarjeta para ver la bodega por dentro, su identificación, superficie, precio, estado y cliente asignado.

También hay cuatro páginas individuales, que abren directamente la ficha correspondiente:
- `espacio-pequeno.html`
- `espacio-mediano.html`
- `espacio-grande.html`
- `espacio-extra-grande.html`

## Editar una bodega
En la ficha selecciona **Editar bodega**, elige el estado, escribe el nombre del cliente cuando está Reservada u Ocupada y guarda. Al ponerla Disponible se limpia el cliente asignado. Los datos quedan almacenados localmente con `localStorage`, de forma que los cambios del catálogo se sincronizan entre páginas cuando se sirven desde un mismo origen (por ejemplo con Live Server).

## Advertencia
Es un prototipo sin backend ni autenticación. Los importes, estados y clientes son ficticios. Las fotografías del catálogo son recortes de la imagen proporcionada; las de interior son ilustrativas y no deben tratarse como fotografías de las propiedades reales. La capacidad indicada está expresada en metros cuadrados de superficie (`m²`), no en metros cúbicos (`m³`).
