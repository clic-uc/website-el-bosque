# TanStack Query Setup

## Configuración completada ✅

Se ha configurado **TanStack Query (React Query)** para gestionar el estado del servidor y las llamadas a la API del backend.

## Estructura creada

```
src/
├── config/
│   └── api.config.ts          # Configuración de la API (URLs, endpoints)
├── lib/
│   ├── api-client.ts          # Axios instance con interceptores
│   └── query-client.ts        # QueryClient y query keys factory
├── services/
│   └── api.service.ts         # Servicios de API (maps, roles, records, seeds)
├── hooks/
│   ├── useMaps.ts            # Hooks para Maps
│   ├── useRoles.ts           # Hooks para Roles
│   └── useRecords.ts         # Hooks para Records
├── types/
│   └── api.types.ts          # Tipos TypeScript del backend
└── pages/
    └── ApiTestPage.tsx       # Componente de prueba
```

## Características

### ✨ API Client (Axios)

- **Interceptores de request**: Logging, autenticación (preparado)
- **Interceptores de response**: Manejo centralizado de errores
- **Base URL configurable**: Via variable de entorno `VITE_API_URL`

### 🔄 TanStack Query

- **Cache inteligente**: 5 minutos de staleTime, 10 minutos de gcTime
- **Query Keys Factory**: Centralizado para fácil invalidación
- **DevTools**: Habilitado en desarrollo para debugging
- **Reintentos**: Configurado para queries y mutations

### 🎯 Hooks Personalizados

#### Maps

- `useMaps()` - Obtener todos los mapas
- `useMap(id)` - Obtener mapa por ID
- `useCreateMap()` - Crear nuevo mapa
- `useUpdateMap()` - Actualizar mapa
- `useDeleteMap()` - Eliminar mapa

#### Roles

- `useRoles(params)` - Obtener roles paginados
- `useRole(roleId)` - Obtener role por ID
- `useCreateRole()` - Crear nuevo role
- `useUpdateRole()` - Actualizar role
- `useDeleteRole()` - Eliminar role
- `useImportRoles()` - Importar roles desde CSV

#### Records

- `useRecords(params)` - Obtener records paginados
- `useRecord(id)` - Obtener record por ID
- `useCreateRecord()` - Crear nuevo record
- `useUpdateRecord()` - Actualizar record
- `useDeleteRecord()` - Eliminar record
- `useImportRecords()` - Importar records desde CSV

## Uso

### 1. Configurar variable de entorno

Copia `.env.example` a `.env.local` y configura la URL del backend:

```bash
VITE_API_URL=http://localhost:3000
```

### 2. Usar hooks en componentes

```tsx
import { useMaps } from "../hooks/useMaps";

function MyComponent() {
  const { data, isLoading, error } = useMaps();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((map) => (
        <li key={map.id}>{map.key}</li>
      ))}
    </ul>
  );
}
```

### 3. Mutations (crear, actualizar, eliminar)

```tsx
import { useCreateMap } from "../hooks/useMaps";

function CreateMapForm() {
  const createMap = useCreateMap();

  const handleSubmit = async (formData) => {
    try {
      await createMap.mutateAsync({
        key: formData.key,
        department: formData.department,
        attributes: formData.attributes,
      });
      alert("Map created!");
    } catch (error) {
      alert("Error creating map");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createMap.isPending}>
        {createMap.isPending ? "Creating..." : "Create Map"}
      </button>
    </form>
  );
}
```

### 4. Paginación

```tsx
import { useRoles } from "../hooks/useRoles";

function RolesList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useRoles({
    page,
    limit: 20,
    search: "optional-search-term",
  });

  return (
    <div>
      {/* Lista de roles */}
      {data?.data.map((role) => (
        <div key={role.roleId}>{role.roleId}</div>
      ))}

      {/* Paginación */}
      <button
        onClick={() => setPage((p) => p - 1)}
        disabled={!data?.meta.hasPreviousPage}
      >
        Previous
      </button>
      <span>
        Page {data?.meta.page} of {data?.meta.totalPages}
      </span>
      <button
        onClick={() => setPage((p) => p + 1)}
        disabled={!data?.meta.hasNextPage}
      >
        Next
      </button>
    </div>
  );
}
```

## Testing

Usa el componente `ApiTestPage` para verificar la conexión:

```tsx
import ApiTestPage from "./pages/ApiTestPage";

// En tu router o App.tsx
<Route path="/api-test" element={<ApiTestPage />} />;
```

Visita `/api-test` para ver:

- ✅ Conexión con el backend
- ✅ Datos de Maps, Roles y Records
- ✅ Información de paginación

## DevTools

En desarrollo, abre las **React Query DevTools** con el botón flotante en la esquina inferior de la pantalla para:

- Ver estado de queries (loading, success, error)
- Inspeccionar cache
- Forzar refetch
- Ver query keys

## Próximos pasos

- [ ] Agregar autenticación (JWT tokens en interceptores)
- [ ] Implementar filtros avanzados (bbox, attributes, dateRange)
- [ ] Agregar optimistic updates para mejor UX
- [ ] Implementar infinite queries para scroll infinito
- [ ] Agregar error boundaries para manejo de errores UI
