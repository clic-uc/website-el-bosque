import { useMemo, useState } from 'react';
import type { GeographicalRecord } from '../../types/api.types';

interface RecordsTableProps {
  records: GeographicalRecord[];
  isLoading?: boolean;
  mapId?: number;
}

const RecordsTable = ({ records, isLoading, mapId }: RecordsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar records por búsqueda
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    
    const searchLower = searchTerm.toLowerCase();
    return records.filter(record => {
      // Buscar en roleId
      if (record.role?.roleId?.toLowerCase().includes(searchLower)) return true;
      
      // Buscar en coordenadas
      if (record.lat?.toString().includes(searchTerm)) return true;
      if (record.lon?.toString().includes(searchTerm)) return true;
      
      // Buscar en attributes
      if (record.recordAttributes) {
        return record.recordAttributes.some(ra => {
          if (ra.attributes) {
            return Object.values(ra.attributes).some(value => 
              String(value).toLowerCase().includes(searchLower)
            );
          }
          return false;
        });
      }
      
      return false;
    });
  }, [records, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // Obtener todas las columnas dinámicas del mapa activo
  const columns = useMemo(() => {
    const cols = new Set<string>();
    
    currentRecords.forEach(record => {
      if (record.recordAttributes) {
        record.recordAttributes.forEach(ra => {
          if (ra.mapId === mapId && ra.attributes) {
            Object.keys(ra.attributes).forEach(key => cols.add(key));
          }
        });
      }
    });
    
    return Array.from(cols);
  }, [currentRecords, mapId]);

  // Obtener attributes específicos del mapa activo
  const getRecordAttributes = (record: GeographicalRecord) => {
    if (!record.recordAttributes) return {};
    
    const recordAttr = record.recordAttributes.find(ra => ra.mapId === mapId);
    return recordAttr?.attributes || {};
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset a primera página
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-gray-700">Cargando registros...</p>
        </div>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="flex w-full items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-gray-700">No hay registros disponibles</p>
          <p className="text-sm text-gray-500 mt-2">
            {mapId ? 'Seleccione un mapa en la barra lateral' : 'No hay datos para mostrar'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      {/* Header con búsqueda y controles */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          {/* Búsqueda */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar en la tabla..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset a primera página al buscar
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Info y controles */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''}
              {searchTerm && ` (filtrado${filteredRecords.length !== records.length ? ` de ${records.length}` : ''})`}
            </span>
            
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
              <option value={200}>200 por página</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla con scroll vertical y horizontal */}
      <div className="flex-1 min-h-0 overflow-auto w-full">
        <table className="border-collapse table-auto">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b whitespace-nowrap">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b whitespace-nowrap">
                Rol SII
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b whitespace-nowrap">
                Latitud
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b whitespace-nowrap">
                Longitud
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record, index) => {
              const attributes = getRecordAttributes(record);
              return (
                <tr
                  key={record.id}
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 border-b whitespace-nowrap">
                    {record.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-b font-mono whitespace-nowrap">
                    {record.role?.roleId || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b font-mono whitespace-nowrap">
                    {record.lat ? record.lat.toFixed(6) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b font-mono whitespace-nowrap">
                    {record.lon ? record.lon.toFixed(6) : '-'}
                  </td>
                  {columns.map(col => (
                    <td
                      key={col}
                      className="px-4 py-3 text-sm text-gray-900 border-b whitespace-nowrap"
                    >
                      {attributes[col] !== undefined ? String(attributes[col]) : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con paginación */}
      <div className="flex-shrink-0 p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRecords.length)} de {filteredRecords.length}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Primera
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="px-4 py-1 text-sm">
              Página {currentPage} de {totalPages || 1}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Última
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordsTable;
