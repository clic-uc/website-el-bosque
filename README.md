# Website El Bosque

Frontend del proyecto "El Bosque" — aplicación web para visualización y gestión de datos georreferenciados en mapas interactivos.

## Stack Tecnológico

- **React 18.3.1** - Librería UI
- **Vite 6.2.0** - Build tool y dev server
- **TypeScript 5.8.3** - Tipado estático
- **Tailwind CSS 3.4.17** - Estilos utility-first
- **Leaflet + React-Leaflet** - Mapas interactivos
- **TanStack Query v5** - Manejo de estado servidor
- **Axios** - Cliente HTTP
- **React Router v7** - Navegación

## Scripts

```bash
npm run dev      # Servidor de desarrollo (http://localhost:5173)
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter (ESLint)
```

## Estructura del Proyecto

```
src/
├── main.tsx                    # Punto de entrada
├── App.tsx                     # Componente raíz con router
├── pages/                      # Páginas de la aplicación
│   └── MapPage.tsx            # Página principal del mapa
├── components/                 # Componentes reutilizables
│   ├── common/
│   │   └── Navbar.tsx         # Barra de navegación
│   └── map/
│       ├── MapDisplay.tsx     # Componente principal del mapa
│       ├── SideBar.tsx        # Sidebar con selección de mapas
│       ├── SidePanel.tsx      # Panel lateral para editar shapes
│       └── ShapeInput.tsx     # Input manual de coordenadas
├── hooks/                      # Custom hooks
│   ├── useMaps.ts             # CRUD de mapas
│   ├── useRecords.ts          # CRUD de records
│   ├── useRoles.ts            # CRUD de roles
│   └── useDrawHooks.tsx       # Lógica de dibujo en mapa
├── services/
│   └── api.service.ts         # Servicios de API (mapas, records, roles)
├── lib/
│   ├── api-client.ts          # Cliente Axios configurado
│   └── query-client.ts        # Configuración de TanStack Query
├── config/
│   └── api.config.ts          # URLs y endpoints del backend
├── types/
│   ├── api.types.ts           # Tipos del backend (MapEntity, Record, etc.)
│   ├── Map.tsx                # Tipo Map del frontend
│   └── Shape.tsx              # Tipos de shapes (Point, Line, Poly)
├── utils/
│   └── mapTransformers.ts     # Transformación backend ↔ frontend
└── data/
    └── elBosqueBorder.geojson.js  # Polígono de El Bosque
```

## Arquitectura de Datos

### Backend ↔ Frontend

El frontend consume datos del backend NestJS mediante TanStack Query. La transformación de datos se centraliza en `utils/mapTransformers.ts`.

**Backend (API)**:

```typescript
MapEntity {
  id: number
  key: string
  department: Department  // enum: EDIFICACION, EJECUCION, etc.
  attributes: {
    name: string
    fields: Array<{ name: string, type: string }>
  }
}

GeographicalRecord {
  id: number
  lat: number
  lon: number
  roleId: string
  recordAttributes: RecordAttribute[]
}

RecordAttribute {
  id: number
  recordId: number
  mapId: number          // Asocia record con mapa específico
  attributes: JSONB      // Datos del record para este mapa
}
```

**Frontend (UI)**:

```typescript
Map {
  id: number
  name: string
  department: "edificacion" | "ejecucion" | "emergencias" | "vivienda"
  attributes: Attribute[]  // Metadata de campos
  shapes: AnyShape[]       // Records transformados a shapes
  drawable: boolean
  shapeType: "point" | "line" | "poly"
}

AnyShape = PointShape | LineShape | PolyShape
{
  id: string
  type: "point" | "line" | "poly"
  layerId: string          // = mapId.toString()
  coordinates: [lat, lon] | [...] | [[...]]
  attributes: Record<string, unknown>
}
```

### Modelo de Coordenadas

- **Formato interno**: `[latitude, longitude]` (compatible con Leaflet)
- **Backend**: Devuelve `{ lat: number, lon: number }`
- **Transformación**: `coordinates: [record.lat, record.lon]`

## Integración con Backend

### Configuración

Configurar URL del backend en `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

### Servicios Disponibles

#### Maps Service (`services/api.service.ts`)

```typescript
mapsService.getAll(); // GET /maps
mapsService.getById(id); // GET /maps/:id
mapsService.create(dto); // POST /maps
mapsService.update(id, dto); // PATCH /maps/:id
mapsService.delete(id); // DELETE /maps/:id
```

#### Records Service

```typescript
recordsService.getAll(params); // GET /records?mapId=X&hasCoordinates=true
recordsService.getById(id); // GET /records/:id
recordsService.create(dto); // POST /records
recordsService.update(id, dto); // PATCH /records/:id
recordsService.delete(id); // DELETE /records/:id
recordsService.importForMap(mapId, file); // POST /records/import/map/:id
```

#### Roles Service

```typescript
rolesService.getAll(params); // GET /roles
rolesService.getById(roleId); // GET /roles/:roleId
rolesService.importCoordinates(file); // POST /roles/import-coordinates
```

### Hooks de TanStack Query

#### useMaps

```typescript
const { data, isLoading, error } = useMaps();
const { mutate } = useCreateMap();
const { mutate } = useUpdateMap();
const { mutate } = useDeleteMap();
```

#### useRecords

```typescript
// Solo carga records de mapas activos con coordenadas
const { data } = useRecords({
  mapId: 5, // Requerido
  hasCoordinates: true, // Filtro server-side
  limit: 100,
});
```

#### Cache Management

TanStack Query mantiene cache con:

- **staleTime**: 5 minutos
- **gcTime**: 10 minutos
- **Invalidación automática**: Las mutaciones invalidan caches relacionados

## Flujo de la Aplicación

### 1. Carga Inicial

```
MapPage.tsx
  ↓
useMaps() → GET /maps
  ↓
transformBackendMapToFrontend()
  ↓
SideBar muestra mapas agrupados por departamento (todos desmarcados)
```

### 2. Selección de Mapa

```
Usuario marca checkbox en SideBar
  ↓
handleToggleMap(mapId) → setActiveMaps([mapId])
  ↓
useRecords({ mapId, hasCoordinates: true })
  ↓
Backend: INNER JOIN record_attributes WHERE mapId = X
  ↓
Frontend: transforma records a shapes
  ↓
MapDisplay renderiza markers en mapa Leaflet
```

### 3. Edición de Shapes (Local)

```
Usuario dibuja/edita shape en mapa
  ↓
react-leaflet-draw emite evento
  ↓
MapDisplay → onDrawCreate / onEditMove / onEditVertex
  ↓
MapPage → setLocalShapes() (solo en estado local)
  ↓
Shapes locales se combinan con shapes del backend
  ↓
MapDisplay re-renderiza
```

**Nota**: Las shapes creadas localmente NO se persisten al backend automáticamente. Se mantienen en estado local hasta implementar persistencia.

## Componentes Principales

### MapPage (`pages/MapPage.tsx`)

Componente contenedor principal que:

- Gestiona estado de mapas activos (`activeMaps`)
- Gestiona shapes locales creados por el usuario (`localShapes`)
- Fetches de datos con `useMaps()` y `useRecords()`
- Combina shapes del backend con shapes locales
- Maneja callbacks de creación/edición/eliminación

### MapDisplay (`components/map/MapDisplay.tsx`)

Componente Leaflet que:

- Renderiza el mapa interactivo
- Muestra markers/polylines/polygons según shapes
- Habilita herramientas de dibujo (react-leaflet-draw)
- Maneja eventos de interacción (click, edit, delete)
- Emite eventos hacia MapPage mediante callbacks

Props principales:

```typescript
{
  maps: Map[]              // Mapas con sus shapes
  activeMap: Map           // Mapa seleccionado para dibujo
  activeMaps: number[]     // IDs de mapas visibles
  onCreateShape: (shape, success, error) => void
  onUpdateShape: (shape, success, error) => void
  onDeleteShape: (id, success, error) => void
}
```

### SideBar (`components/map/SideBar.tsx`)

Panel lateral que:

- Agrupa mapas por departamento (colapsables)
- Muestra checkboxes para seleccionar mapas
- Controla visibilidad de records en el mapa
- Cada departamento muestra contador de mapas

Estructura:

```
📁 Edificación (9)
  ☐ Edificación Nueva
  ☐ Obras Menores
  ☑ Permiso de Edificación
  ...

📁 Ejecución (5)
  ☐ Calzadas
  ☐ Veredas
  ...
```

### SidePanel (`components/map/SidePanel.tsx`)

Panel emergente para editar attributes de un shape seleccionado:

- Muestra formulario dinámico según `map.attributes`
- Permite editar valores de cada campo
- Botón "Guardar" llama `onUpdateShape`
- Botón "Cancelar" cierra el panel

## Sistema de Shapes

### Tipos de Shapes

**PointShape**: Representa un marcador

```typescript
{
  id: "record-123",
  type: "point",
  layerId: "5",
  coordinates: [-33.45, -70.66],
  attributes: { roleId: "...", nombre: "..." }
}
```

**LineShape**: Representa una línea/camino

```typescript
{
  type: "line",
  coordinates: [[-33.45, -70.66], [-33.46, -70.67], ...]
}
```

**PolyShape**: Representa un polígono/área

```typescript
{
  type: "poly",
  coordinates: [[[-33.45, -70.66], [-33.46, -70.67], ...]]
}
```

### Parsers de Coordenadas

Funciones en `components/map/MapDisplay.tsx`:

- `parsePointLatLng(marker)` → `[lat, lng]`
- `parseLineLatLngs(polyline)` → `[[lat, lng], ...]`
- `parsePolyLatLngs(polygon)` → `[[[lat, lng], ...]]`

### layerId: Identificador de Mapa

Anteriormente `layerId` se usaba para "capas dentro de mapas", pero eso fue un malentendido.

**Arquitectura actual**:

- `layerId` = `mapId.toString()`
- No hay concepto de capas internas
- Cada mapa es independiente
- Ver `ARQUITECTURA_ACTUALIZADA.md` para detalles

## Limitaciones Actuales

1. **Solo primer mapa activo carga records**: Si seleccionas múltiples mapas, solo se cargan records del primero.
2. **Límite de 100 records**: Paginación no implementada en UI.
3. **Shapes locales no persisten**: Se pierden al recargar la página.
4. **Sin clustering**: Alta densidad de markers puede afectar performance.
5. **Sin filtros avanzados**: No se puede buscar por atributos específicos.
6. **SidePanel se cierra al agrupar markers**: Cuando un marker seleccionado se agrupa en un cluster (zoom out), el panel lateral se cierra automáticamente. Requiere revisión de la lógica de preservación de estado de selección.

## Documentación Adicional

- `ARQUITECTURA_ACTUALIZADA.md` - Evolución de la arquitectura y decisiones de diseño
- `ARQUITECTURA_SHAPES.md` - Detalles sobre el sistema de shapes
