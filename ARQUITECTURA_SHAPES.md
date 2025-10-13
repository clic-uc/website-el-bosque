# Arquitectura de Shapes y Records

## 📊 Estructura de Datos

### Backend: GeographicalRecord

```typescript
GeographicalRecord {
  id: number
  roleId: string          // Identificador del rol asociado (opcional)
  lat: number            // Coordenada latitud
  lon: number            // Coordenada longitud
  summary?: string
  role?: Role            // Relación con tabla roles
  recordAttributes?: RecordAttribute[]  // ⚠️ CLAVE: Asociación con mapas
  createdAt: string
  updatedAt: string
}

RecordAttribute {
  id: number
  recordId: number       // FK a GeographicalRecord
  mapId: number          // ⚠️ Define a qué mapa pertenece este record
  attributes: JSONB      // Datos específicos para este mapa
  createdAt: string
  updatedAt: string
}
```

### Frontend: AnyShape

```typescript
AnyShape {
  id: string                          // Único identificador
  type: "point" | "line" | "poly"    // Tipo de geometría
  layerId: string                     // Ya no se usa para filtrado
  coordinates: [...] | [[...]]       // Depende del tipo
  attributes: Record<string, unknown> // Datos para mostrar en popup/sidebar
}
```

## 🔄 Transformación Record → Shape

### Caso 1: Record con RecordAttributes (✅ Correcto)

```typescript
// Backend
{
  id: 1,
  lat: -33.45,
  lon: -70.66,
  roleId: "12345-67890",
  recordAttributes: [
    { mapId: 1, attributes: { nombre: "Edificio A", pisos: 5 } },
    { mapId: 3, attributes: { capacidad: 200 } }
  ]
}

// Frontend: Se crea 1 shape por cada mapId
Map 1: { id: "record-1-map-1", coordinates: [-33.45, -70.66], attributes: { nombre: "Edificio A", pisos: 5 } }
Map 3: { id: "record-1-map-3", coordinates: [-33.45, -70.66], attributes: { capacidad: 200 } }
```

### Caso 2: Record sin RecordAttributes (⚠️ No se muestra)

```typescript
// Backend
{
  id: 2,
  lat: -33.46,
  lon: -70.67,
  roleId: "11111-22222",
  recordAttributes: []  // Sin asociación a mapas
}

// Frontend: No se crea ningún shape
// El record existe en BD pero no tiene información de "en qué mapa mostrarlo"
```

## 🗺️ Layers: ¿Qué pasó con ellos?

### Arquitectura Anterior (❌ Removida)

```typescript
// Los mapas tenían capas predefinidas
Map {
  id: 1,
  layers: [
    { id: "edificios", name: "Edificios" },
    { id: "calles", name: "Calles" }
  ]
}

// Los shapes se asociaban a capas
Shape {
  layerId: "edificios"  // Se filtraba por esta capa
}

// Usuario activaba/desactivaba capas dentro de cada mapa
activeLayers[mapId] = ["edificios"]  // Solo mostrar capa edificios
```

### Arquitectura Actual (✅ Vigente)

```typescript
// Los mapas NO tienen capas
Map {
  id: 1,
  name: "Infraestructura",
  department: "ejecucion",
  attributes: [...] // Campos que cada record puede tener
}

// Los records se asocian directamente a mapas
RecordAttribute {
  mapId: 1  // Este record pertenece al mapa 1
}

// Usuario activa/desactiva mapas completos, no capas
activeMaps = [1, 3, 5]  // Mostrar mapas 1, 3 y 5 completos
```

### ¿Por qué se removieron los layers?

1. **No hay estructura para ello en el backend**:

   - `MapEntity` define atributos/campos, no capas
   - `RecordAttribute` asocia records a mapas, no a capas

2. **Semánticamente no tiene sentido**:

   - Cada mapa representa un "tipo de dato" completo (ej: "Infraestructura Deportiva")
   - No necesitas subdividirlo en capas internas
   - Si quieres separar, creas otro mapa

3. **Simplifica la UI**:
   - Antes: Expandir mapa → seleccionar capas (2 niveles)
   - Ahora: Checkbox por mapa (1 nivel)

## 🚀 Flujo Actual

```
1. Backend: 50k+ GeographicalRecords en BD
           ↓
2. API: GET /records?page=1&limit=100
           ↓
3. Frontend: useRecords() fetch
           ↓
4. Transformación: recordsData → shapesFromRecords
   - Por cada record con recordAttributes
   - Crear 1 shape por cada mapId en recordAttributes
           ↓
5. Merge: shapesFromRecords + localShapes (user-created)
           ↓
6. Filter: Solo mapas en activeMaps
           ↓
7. Display: MapDisplay renderiza shapes como markers/polygons
```

## ⚠️ Problemas Actuales y Soluciones

### Problema 1: Paginación limitada

**Situación**: Solo cargamos 100 records (límite backend)

**Opciones**:

A. **Cargar por mapa activo** (Recomendado):

```typescript
// Nuevo endpoint: GET /records?mapId=1&page=1&limit=100
// Solo cargar records del mapa seleccionado
useRecords({ mapId: activeMap.id, page: 1, limit: 100 });
```

B. **Infinite scroll**:

```typescript
// Usar @tanstack/react-query infinite queries
useInfiniteQuery({
  queryKey: ["records"],
  queryFn: ({ pageParam }) =>
    recordsService.getAll({ page: pageParam, limit: 100 }),
  getNextPageParam: (lastPage) => lastPage.meta.page + 1,
});
```

C. **Lazy loading por viewport**:

```typescript
// Solo cargar records dentro del bbox visible del mapa
useRecords({
  bbox: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
  limit: 100,
});
```

### Problema 2: Records sin recordAttributes

**Situación**: Records en BD pero no aparecen en ningún mapa

**Solución**: Crear RecordAttributes al importar CSVs:

```typescript
// Al importar un CSV para el mapa con id=5
await recordsService.importForMap(5, file);
// Backend debe crear RecordAttribute con mapId=5 para cada record
```

### Problema 3: Duplicación de código layerId

**Situación**: `layerId: "records"` sigue en el código pero no se usa

**Opción 1**: Mantenerlo para futura funcionalidad
**Opción 2**: Removerlo completamente si nunca se usará

## 📝 TODOs Pendientes

1. [ ] Implementar endpoint GET /records?mapId=X en backend
2. [ ] Cambiar useRecords() para cargar solo mapa activo
3. [ ] Implementar infinite scroll o bbox filtering
4. [ ] Validar que importación CSV cree RecordAttributes correctamente
5. [ ] Decidir si mantener o remover campo `layerId` de shapes
6. [ ] Implementar CRUD de shapes conectado al backend (actualizar RecordAttributes)
7. [ ] Agregar indicador visual de cantidad de records por mapa
8. [ ] Implementar clustering de markers para alta densidad de points

## 🎯 Decisión de Diseño: ¿Reintroducir Layers?

**Solo si necesitas**:

- Mostrar múltiples "tipos" de datos en el mismo mapa conceptual
- Ejemplo: Mapa "Infraestructura" con capas "Calles", "Veredas", "Platabandas"

**Entonces necesitarías**:

1. Backend: Agregar campo `layer` a RecordAttribute
2. Frontend: Reintroducir state `activeLayers[mapId][]`
3. UI: Expandir mapas para mostrar checkboxes de capas

**Por ahora**: NO es necesario. La estructura actual es suficiente.
