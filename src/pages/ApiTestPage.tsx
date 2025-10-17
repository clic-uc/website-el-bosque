import { useMaps } from '../hooks/useMaps';
import { useRoles } from '../hooks/useRoles';
import { useRecords } from '../hooks/useRecords';

/**
 * Componente de ejemplo para probar la conexión con el backend
 */
export default function ApiTestPage() {
  // Fetch de mapas
  const { data: mapsData, isLoading: mapsLoading, error: mapsError } = useMaps();

  // Fetch de roles
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useRoles();

  // Fetch de records
  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
  } = useRecords();

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">API Connection Test</h1>

      {/* Maps Section */}
      <section className="border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Maps</h2>
        {mapsLoading && <p className="text-gray-500">Loading maps...</p>}
        {mapsError && (
          <p className="text-red-500">Error: {(mapsError as Error).message}</p>
        )}
        {mapsData && (
          <div>
            <p className="mb-2">
              <strong>Total Maps:</strong> {mapsData.length}
            </p>
            <ul className="space-y-2">
              {mapsData.slice(0, 5).map((map) => (
                <li key={map.id} className="bg-gray-100 p-3 rounded">
                  <strong>{map.key}</strong> - {map.department}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Roles Section */}
      <section className="border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Roles</h2>
        {rolesLoading && <p className="text-gray-500">Loading roles...</p>}
        {rolesError && (
          <p className="text-red-500">Error: {(rolesError as Error).message}</p>
        )}
        {rolesData && (
          <div>
            <p className="mb-2">
              <strong>Total Roles:</strong> {rolesData.length}
            </p>
            <ul className="space-y-2">
              {rolesData.slice(0, 5).map((role) => (
                <li key={role.roleId} className="bg-gray-100 p-3 rounded">
                  <strong>{role.roleId}</strong>
                  {role.lat && role.lon && (
                    <span className="ml-2 text-sm text-gray-600">
                      ({role.lat}, {role.lon})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Records Section */}
      <section className="border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Records</h2>
        {recordsLoading && <p className="text-gray-500">Loading records...</p>}
        {recordsError && (
          <p className="text-red-500">Error: {(recordsError as Error).message}</p>
        )}
        {recordsData && (
          <div>
            <p className="mb-2">
              <strong>Total Records:</strong> {recordsData.length}
            </p>
            <ul className="space-y-2">
              {recordsData.slice(0, 5).map((record) => (
                <li key={record.id} className="bg-gray-100 p-3 rounded">
                  <strong>Record #{record.id}</strong> - Role: {record.role?.roleId || 'N/A'}
                  <span className="ml-2 text-sm text-gray-600">
                    ({record.lat}, {record.lon})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
