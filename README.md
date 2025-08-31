# website-el-bosque

Sitio frontend del proyecto "El Bosque" — una aplicación React + Vite que muestra mapas interactivos (Leaflet) y permite dibujar/gestionar formas.

## Resumen

- Tecnologías: React, Vite, TypeScript, Tailwind CSS, Leaflet, react-leaflet, react-leaflet-draw.
- Propósito: interfaz web para visualizar y editar georreferencias y mapas.

## Scripts útiles

- `npm run dev` — Levanta el servidor de desarrollo (Vite + HMR).
- `npm run build` — Genera la versión de producción en `dist/`.
- `npm run preview` — Sirve la build de producción localmente para pruebas.
- `npm run lint` — Ejecuta ESLint sobre el proyecto.

## Estructura principal

- `index.html` - plantilla HTML.
- `src/` - código fuente React + TypeScript.
	- `main.tsx` - punto de entrada.
	- `App.tsx` / `App.css` - componente raíz y estilos.
	- `pages/` - páginas de la app (`MapPage.tsx`, `MapContainer.jsx`).
	- `components/` - componentes reutilizables (ej. `map/MapDisplay.tsx`, `SideBar.tsx`, `ShapeInput.tsx`).
	- `hooks/` - hooks personalizados (`useConfig.tsx`, `useCoordinates.tsx`, `useDrawHooks.tsx`, `useLoadGeoJson.js`).
	- `data/` - datos estáticos (`elBosqueBorder.geojson.js`).
- `public/` - activos públicos (logo, `kml/`).
- `tailwind.config.js`, `postcss.config.js` - configuración de Tailwind.
- `vite.config.ts` - configuración de Vite.

## Detalles de implementación

A continuación se describe con más profundidad cómo está organizado el frontend, cómo están modelados los datos, el flujo de creación/edición/eliminación de formas en el mapa, y recomendaciones prácticas.

### 1) Resumen de la arquitectura

- Stack: React + Vite + TypeScript + Tailwind CSS.
- Mapas: Leaflet a través de `react-leaflet` y edición con `react-leaflet-draw`.
- Punto de entrada: `src/main.tsx` → `src/App.tsx` (Router) → `src/pages/MapPage.tsx`.
- Componente central de mapas: `src/components/map/MapDisplay.tsx`.
- Hooks de configuración y utilitarios: `src/hooks/useConfig.tsx` y otros hooks en `src/hooks/`.

### 2) Modelo de datos

- `Map` (`src/types/Map.tsx`): contiene id, nombre, department, atributos (metadatos), `drawable` (si puede editarse), `shapeType` (point|line|poly) y `shapes: AnyShape[]`.
- `AnyShape` (`src/types/Shape.tsx`): unión de `PointShape`, `LineShape`, `PolyShape`. Cada shape incluye `id`, `layerId` y `attributes: Record<string, string|number|boolean>`.

Notas sobre coordenadas:
- Internamente el código de interacción con Leaflet convierte y usa pares [lat, lng] (ej. `parsePointLatLng` devuelve `[lat, lng]`).
- Sin embargo, el comentario en `types/Shape.tsx` menciona `[longitude, latitude]` y esto crea una contradicción potencial con integraciones externas (GeoJSON usa [lng, lat]).

### 3) Flujo de creación / edición / eliminación de formas

- Creación por dibujo:
	- `EditControl` (react-leaflet-draw) emite `onCreated` que es capturado en `MapDisplay` (`onDrawCreate`).
	- Se transforma el evento en un `AnyShape` (se asigna `id` con `uuid`) y se llama `onCreateShape(shape, success, error)` pasado por props.
	- El componente padre (`MapPage`) añade la forma al array `activeMap.shapes` y ejecuta `success`.
- Edición:
	- `onEditMove` y `onEditVertex` detectan cambios en marcadores y vértices, recalculan `coordinates` y llaman `onUpdateShape(updatedShape, success, error)`.
	- El padre reemplaza la forma correspondiente en el estado.
- Eliminación:
	- Los `eventHandlers` de cada layer llaman `onDeleteShape(id, success, error)` que el padre usa para filtrar la forma del array.

Soporte de UI auxiliar:
- `SidePanel` se abre cuando hay una `selectedShape` y permite editar atributos y guardar (llama `onUpdateShape`).
- `SideBar` controla la visibilidad de capas mediante `activeLayers`.

### 4) Inconsistencias y riesgos detectados por Copilot

1. Convención de coordenadas (lat/lng vs lng/lat): hay una inconsistencia entre los comentarios de tipos y el uso en Leaflet. Riesgo de invertir coordenadas al comunicar con backend o al exportar/importar GeoJSON.
2. `src/hooks/useLoadGeoJson.js` está escrito para Google Maps (`@vis.gl/react-google-maps`) y no para Leaflet — parece fuera de contexto.
3. `ShapeInput.tsx` está parcialmente implementado: UI para puntos incompleta (faltan handlers para crear y validar coordenadas) y sin soporte para líneas/polígonos.
4. Mezcla de `.js` y `.tsx` en hooks y uso extendido de `any` en handlers de `react-leaflet-draw` — recomendable tipar mejor para seguridad.
5. `useConfig.tsx` devuelve valores hardcodeados; es mejor migrar configuración sensible a `.env` o a un archivo de configuración centralizable.

### 5) Recomendaciones de Copilot

1. Normalizar la convención de coordenadas:
	 - Decidir si internamente se representa `[lat, lng]` (más directo con Leaflet) o se usa la convención GeoJSON `[lng, lat]` y documentarlo, luego aplicar conversiones centralizadas.
	 - Actualizar comentarios de `src/types/Shape.tsx` y añadir tests para los parseadores (`parsePointLatLng`, `parseLineLatLngs`, `parsePolyLatLngs`).
2. Eliminar o reimplementar `src/hooks/useLoadGeoJson.js` para Leaflet (usar `L.geoJSON` o el componente `GeoJSON` de `react-leaflet`).
3. Completar `ShapeInput.tsx`: añadir validación de texto, creación de shapes, y preview en el mapa (`inputGroupRef`).
4. Mejorar tipado y reducir `any` en handlers de `react-leaflet-draw` donde sea posible.
5. Integrar llamadas reales al backend en `pages/MapPage.tsx` (fetch/axios) con manejo de errores y/o UI optimista.