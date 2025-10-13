# Arquitectura Actualizada - Sistema de Mapas y Records

## 🎯 Aclaraciones Fundamentales

### ❌ Malentendido Original: "Layers dentro de Mapas"

El equipo inicialmente pensó que cada mapa tendría **capas internas** (layers) que se podían activar/desactivar.

**Ejemplo del malentendido**:

```
Mapa "Infraestructura"
  ├─ Layer "Edificios" ☑️
  ├─ Layer "Calles" ☐
  └─ Layer "Plazas" ☑️
```

### ✅ Arquitectura Real del Backend

El backend no tiene concepto de "layers dentro de mapas". La estructura es:

```
Departamentos (agrupación UI)
  └─ Mapas (entidades independientes)
       └─ Records (datos puntuales con coordenadas)
```

**Ejemplo real**:

```
Departamento "Ejecución"
  ├─ Mapa "Calzadas" (id: 1)
  │    └─ 1000 records con lat/lon
  ├─ Mapa "Veredas" (id: 2)
  │    └─ 500 records con lat/lon
  └─ Mapa "Platabandas" (id: 3)
       └─ 300 records con lat/lon
```

## 📊 Estructura de Datos Corregida

### Backend

```typescript
GeographicalRecord {
  id: number
  roleId: string
  lat: number
  lon: number
  recordAttributes: RecordAttribute[]
}

RecordAttribute {
  id: number
  recordId: number
  mapId: number        // ⚠️ Asocia el record con UN mapa específico
  attributes: JSONB    // Datos específicos para visualizar en ESE mapa
}
```

### Frontend

```typescript
AnyShape {
  id: string
  type: "point" | "line" | "poly"
  layerId: string      // ✅ AHORA = mapId (corregido el malentendido)
  coordinates: [...]
  attributes: Record<string, unknown>
}
```

## 🔄 Flujo Actualizado

### 1. Usuario abre la aplicación

- ✅ Sidebar muestra todos los mapas **desmarcados** por defecto
- ✅ Mapas agrupados por departamento
- ✅ El mapa leaflet está vacío (sin datos)

### 2. Usuario selecciona un mapa (checkbox)

```typescript
// Frontend dispara:
useRecords({
  mapId: 5, // ✅ Solo el mapa seleccionado
  hasCoordinates: true, // ✅ Filtrado server-side
  limit: 100,
});
```

### 3. Backend filtra eficientemente

```sql
SELECT r.*, ra.*
FROM geographical_records r
INNER JOIN record_attributes ra ON ra.recordId = r.id
WHERE ra.mapId = 5           -- Solo records de este mapa
  AND r.lat IS NOT NULL      -- Solo con coordenadas
  AND r.lon IS NOT NULL
LIMIT 100;
```

### 4. Frontend transforma y renderiza

```typescript
// Record del backend:
{
  id: 123,
  lat: -33.45,
  lon: -70.66,
  roleId: "12345-67890",
  recordAttributes: [{
    mapId: 5,
    attributes: { nombre: "Plaza Central", superficie: 500 }
  }]
}

// Se transforma a Shape:
{
  id: "record-123",
  type: "point",
  layerId: "5",  // ✅ layerId = mapId
  coordinates: [-33.45, -70.66],
  attributes: {
    recordId: 123,
    roleId: "12345-67890",
    nombre: "Plaza Central",
    superficie: 500
  }
}

// Se renderiza como marker en el mapa
```

## 🚀 Mejoras Implementadas

### Backend

1. ✅ **Nuevo parámetro `mapId`** en GET /records
2. ✅ **Nuevo parámetro `hasCoordinates`** en GET /records
3. ✅ Filtrado server-side eficiente con JOIN
4. ✅ Evita enviar 50k records innecesarios

### Frontend

1. ✅ **Mapas desmarcados por defecto** (el usuario elige qué ver)
2. ✅ **Carga bajo demanda** (solo al seleccionar un mapa)
3. ✅ **layerId = mapId** (corregido el concepto)
4. ✅ Evita duplicación de records en todos los mapas

## 📝 Decisiones de Diseño

### ¿Por qué layerId sigue existiendo si ahora es igual a mapId?

**Respuesta**: Mantiene la flexibilidad arquitectónica:

- Actualmente: `layerId = mapId.toString()`
- Futuro posible: Si necesitas subcapas, puedes usar `layerId = "mapId-layerName"`
- No rompe la interfaz de `AnyShape`

### ¿Qué pasa si un record tiene múltiples RecordAttributes?

**Ejemplo**:

```typescript
record {
  id: 1,
  lat: -33.45,
  lon: -70.66,
  recordAttributes: [
    { mapId: 1, attributes: { tipo: "comercial" } },
    { mapId: 3, attributes: { riesgo: "alto" } }
  ]
}
```

**Comportamiento**:

- Si el usuario selecciona **solo Mapa 1**: Ve 1 marker con atributo "tipo: comercial"
- Si el usuario selecciona **solo Mapa 3**: Ve 1 marker con atributo "riesgo: alto"
- Si el usuario selecciona **ambos mapas**: Ve 2 markers (mismas coordenadas, atributos diferentes)

Esto es **correcto** porque el mismo punto geográfico puede tener significados distintos en contextos diferentes.

## ⚠️ Limitaciones Actuales

### 1. Solo se cargan records del PRIMER mapa activo

```typescript
const firstActiveMapId = activeMaps[0];
// Si el usuario selecciona mapas [1, 3, 5], solo carga records del mapa 1
```

**Solución pendiente**:

- Opción A: Hacer múltiples queries paralelas (una por mapa)
- Opción B: Backend acepta `mapId=1,3,5` (múltiples IDs)

### 2. Límite de 100 records por mapa

```typescript
useRecords({ mapId: 5, limit: 100 });
// Si el mapa tiene 5000 records, solo se muestran 100
```

**Solución pendiente**:

- Implementar infinite scroll
- Implementar clustering de markers
- Implementar filtrado por bbox del viewport

### 3. Records sin coordenadas quedan inaccesibles desde el mapa

```typescript
// Estos records existen pero no se pueden visualizar en el mapa
{ id: 50, roleId: "11111-22222", lat: null, lon: null }
```

**Solución pendiente**:

- Crear vista de tabla para records sin coordenadas
- Permitir asignar coordenadas manualmente desde UI

## 🎯 TODOs Inmediatos

### Alta Prioridad

1. [ ] Cargar records de TODOS los mapas activos, no solo el primero
2. [ ] Agregar indicador visual de "Cargando records..." cuando se selecciona un mapa
3. [ ] Agregar contador de records en cada checkbox de mapa (ej: "Calzadas (1,234)")

### Media Prioridad

4. [ ] Implementar clustering para alta densidad de points
5. [ ] Implementar infinite scroll o paginación visible
6. [ ] Agregar búsqueda por roleId desde el sidebar

### Baja Prioridad

7. [ ] Vista de tabla para records sin coordenadas
8. [ ] Exportar records visibles a CSV
9. [ ] Filtros avanzados (rango de fechas, atributos custom)

## 🧪 Cómo Probar

### Test 1: Mapas desmarcados por defecto

1. Abrir aplicación
2. ✅ Verificar que sidebar no tiene checkboxes marcados
3. ✅ Verificar que el mapa está vacío (sin markers)

### Test 2: Carga de records al seleccionar mapa

1. Marcar checkbox de "Calzadas"
2. ✅ Abrir DevTools Network
3. ✅ Ver request: `GET /records?mapId=X&hasCoordinates=true&limit=100`
4. ✅ Ver markers aparecer en el mapa

### Test 3: Records filtrados por coordenadas

1. En backend, crear record sin coordenadas: `{ lat: null, lon: null }`
2. Seleccionar su mapa
3. ✅ Verificar que NO aparece en el mapa (filtrado correctamente)

### Test 4: layerId correcto

1. Inspeccionar un marker en el mapa
2. ✅ Verificar que `shape.layerId === mapId.toString()`

## 📚 Comparación Antes/Después

| Aspecto            | ❌ Antes                                       | ✅ Ahora                                     |
| ------------------ | ---------------------------------------------- | -------------------------------------------- |
| Mapas al inicio    | Todos activos                                  | Todos inactivos                              |
| Carga de records   | Todos de una vez (100 total)                   | Solo del mapa seleccionado                   |
| layerId            | Siempre "records"                              | = mapId                                      |
| Filtro coordenadas | Frontend                                       | Backend (eficiente)                          |
| Records duplicados | Sí (en todos los mapas)                        | No (solo en su mapa)                         |
| Performance        | 🔴 Malo (100 records x 15 mapas = 1500 shapes) | 🟢 Bueno (100 records x 1 mapa = 100 shapes) |

## 🎓 Lecciones Aprendidas

1. **Comunicación del equipo es crítica**: El malentendido de "layers" retrasó el desarrollo.
2. **Backend define la arquitectura**: El frontend debe adaptarse a cómo el backend estructura los datos.
3. **Filtrado server-side es esencial**: Con 50k+ records, filtrar en frontend no escala.
4. **Carga bajo demanda > Carga anticipada**: Los usuarios no necesitan todos los datos inmediatamente.
5. **layerId puede ser flexible**: No necesita eliminarse, solo reinterpretarse.
