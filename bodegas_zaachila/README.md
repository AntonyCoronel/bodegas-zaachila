# Bodegas Seguras Zaachila — 4 bodegas de renta (Demo)

## Archivos
- `index.html`: catálogo público con cuatro bodegas, fotografías ilustrativas, códigos, precios y disponibilidad.
- `bodega.html?id=1` (hasta `?id=4`): ficha individual para visualizar el interior ilustrativo, contenido y detalles.
- `dashboard.html`: administra precio, capacidad en m³, estado y cliente asignado; revisa solicitudes.
- `assets/js/data.js`: datos iniciales y persistencia `localStorage`.
- `assets/images/`: fotografías representativas de ejemplo (no son imágenes verificadas de inmuebles reales). La 4.ª imagen es una composición de fotografías ilustrativas.

## Ejecución
1. Descomprime esta carpeta y ábrela completa en Visual Studio Code.
2. Abre `index.html` con la extensión **Live Server** (recomendado) o desde el explorador.
3. Para el panel administrativo, abre `dashboard.html` dentro del mismo sitio/navegador.
4. En `dashboard.html`, pulsa **Editar** en cualquier bodega. Asigna un cliente cuando el estado sea **Reservada** u **Ocupada**. Si eliges **Disponible**, la asignación se borra automáticamente.
5. Regresa al catálogo para ver el estado actualizado; las nuevas solicitudes se muestran en el dashboard.
6. Si ya tenías el prototipo de 3 bodegas, esta versión intenta importar tus ajustes guardados y añade `BOD-004`. Para recuperar todos los ejemplos iniciales, pulsa **Restaurar demo**.

## Datos iniciales
| Código | Bodega | Volumen | Precio mensual (demo) | Estado | Cliente (demo) |
|---|---|---:|---:|---|---|
| BOD-001 | Mini | 3 m³ | $499 | Disponible | Ninguno |
| BOD-002 | Mediana | 6 m³ | $899 | Reservada | Ana Martínez (demo) |
| BOD-003 | Comercial | 7 m³ | $1199 | Ocupada | Comercial Oaxaca (demo) |
| BOD-004 | Familiar | 12 m³ | $1799 | Disponible | Ninguno |

## Alcance y advertencias
Este es un **prototipo local, no un sistema en producción**. No tiene autenticación ni servidor, y su dashboard **no debe publicarse para capturar clientes reales**. Los registros de clientes, estados y solicitudes están en `localStorage` del navegador, no se comparten con otros dispositivos ni se envían a un correo.
Los precios, volúmenes, dimensiones y clientes son ilustrativos. La ubicación y los datos comerciales deben verificarse. Las fotografías ilustran posibles usos de las bodegas, no instalaciones certificadas de la empresa.
Para implementar uso real se requiere backend, base de datos, sesiones de administrador y reglas de privacidad.
