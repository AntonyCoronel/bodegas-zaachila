# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular (standalone components, signals) in `bodega-angular/`. The original static HTML pages stay in the repo root as the visual reference. Data goes through a REST API (`/api/...`) that classmates will build; until it exists, an in-app mock backend (HTTP interceptor over localStorage) answers the same routes. The contract lives in `bodega-angular/API.md`.

## Users

- **Visitante / cliente potencial:** someone in or near Villa de Zaachila, Oaxaca who needs to store belongings, furniture, merchandise or a vehicle, and is comparing sizes and prices before asking for a bodega.
- **Cliente (inquilino):** a person who already rents, or is asking to rent, one of the bodegas. Job: request a bodega, pay the monthly fee, and see their bodega, contract and 24/7 access code.
- **Dueño:** the owner who runs the bodegas. Job: approve or reject rental requests, edit each bodega (price, status, assigned client), follow payments and monthly income, and see the client list.

## Product Purpose

Website and management system for "Bodega Segura Zaachila" (also written "Bodegas Seguras Zaachila"), a self-storage business. The public site persuades and informs (sizes, features, location, contact). The two dashboards let renters and the owner handle the rental cycle: request, approval, payment, occupancy.

Success for this project: the static site is ported to Angular without losing its look, and both dashboards work end to end against the API contract, ready for the classmates' backend.

## Positioning

The site claims to be "el único almacenamiento seguro en todo Zaachila": monthly contracts without permanence clauses, 24/7 surveillance, cameras, controlled access, moving and packing services.

## Operating Context

School project for Desarrollo Web (quinto semestre). Graded and demonstrated in class. The backend is built by teammates in parallel, so the front end must keep a clear, documented API boundary.

## Capabilities and Constraints

- Four rentable units, matching the "4 espacios" catalog: BOD-001 Espacio pequeño (2 × 2 m, 4 m²), BOD-002 Espacio mediano (3 × 3 m, 9 m²), BOD-003 Espacio grande (4 × 5 m, 20 m²), BOD-004 Espacio extra grande (5 × 8 m, 40 m²).
- Unit status values: Disponible, Reservada, Ocupada.
- Terminology: bodega, espacio, cliente, dueño, solicitud, contrato, mensualidad, pago, código de acceso.
- The home page lists volumes in m³ (3–13 m³) while the catalog uses m²; this inconsistency comes from the original content and is kept as-is.
- No real payment processing: online payment is simulated.

## Brand Commitments

- Name: Bodega Segura Zaachila. Logo: `imagenes/logo.jpeg` (on a white background).
- Phone +52 951 461 6417, email bodegasegurazaachila@gmail.com, Villa de Zaachila, Oaxaca. Hours: L–V 7:00–20:00, Sáb 8:00–18:00, Dom 9:00–17:00; 24/7 access with a personal code.
- The user asked to keep the existing design of every page when porting.
- Language: Spanish (Mexico), informal "tú".

## Evidence on Hand

- Photos: `imagenes/img1–3.jpeg`, `proyecto/*.jpg|png`, `proyecto/espacios/imagenes/*.webp` (reference and illustrative interior per unit).
- Clients, prices and payments are fictional examples for a school project and must be labeled as examples. No testimonials, reviews or statistics exist; do not invent them.

## Product Principles

1. Keep the incumbent look; new screens extend it rather than replace it.
2. One shared data contract: the public catalog, the client dashboard and the owner dashboard read the same bodegas, so a change by one is visible to the others.
3. Every state change in the rental cycle is explicit and reversible by the owner (request → approved → reserved → occupied → finished).
4. Demo data is always marked as an example.
