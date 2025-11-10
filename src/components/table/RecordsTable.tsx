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
  
  // Estado para celdas en edición: { recordId: { columnName: value } }
  const [editingCells, setEditingCells] = useState<Record<number, Record<string, string>>>({});
  
  // Estado para tracking qué filas están siendo editadas
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set());

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

  // Funciones para manejo de edición
  const startEditingCell = (recordId: number, columnName: string, currentValue: string) => {
    setEditingCells(prev => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || {}),
        [columnName]: currentValue
      }
    }));
    setEditingRows(prev => new Set(prev).add(recordId));
  };

  const updateCellValue = (recordId: number, columnName: string, newValue: string) => {
    setEditingCells(prev => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || {}),
        [columnName]: newValue
      }
    }));
  };

  const saveRowChanges = (recordId: number) => {
    // MOCKUP: solo loguear cambios
    console.log('💾 Guardar cambios para record', recordId, editingCells[recordId]);
    alert(`Cambios guardados (mockup):\n${JSON.stringify(editingCells[recordId], null, 2)}`);
    
    // Limpiar estado de edición
    const newEditingCells = { ...editingCells };
    delete newEditingCells[recordId];
    setEditingCells(newEditingCells);
    
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(recordId);
    setEditingRows(newEditingRows);
  };

  const revertRowChanges = (recordId: number) => {
    // Limpiar estado de edición
    const newEditingCells = { ...editingCells };
    delete newEditingCells[recordId];
    setEditingCells(newEditingCells);
    
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(recordId);
    setEditingRows(newEditingRows);
  };

  const isRowEditing = (recordId: number) => editingRows.has(recordId);
  
  const getCellValue = (recordId: number, columnName: string, originalValue: string) => {
    return editingCells[recordId]?.[columnName] ?? originalValue;
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
      <div className="flex items-center justify-center h-full">
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
              {/* Columna de acciones */}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-b whitespace-nowrap sticky right-0 bg-gray-100">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record, index) => {
              const attributes = getRecordAttributes(record);
              const editing = isRowEditing(record.id);
              
              return (
                <tr
                  key={record.id}
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} ${editing ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 border-b whitespace-nowrap">
                    {record.id}
                  </td>
                  
                  {/* Rol SII - Editable */}
                  <td className="px-4 py-3 text-sm border-b font-mono whitespace-nowrap">
                    {editing ? (
                      <input
                        type="text"
                        value={getCellValue(record.id, 'roleId', record.role?.roleId || '')}
                        onChange={(e) => updateCellValue(record.id, 'roleId', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="00000-00000"
                      />
                    ) : (
                      <span
                        onClick={() => startEditingCell(record.id, 'roleId', record.role?.roleId || '')}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded block"
                      >
                        {record.role?.roleId || '-'}
                      </span>
                    )}
                  </td>
                  
                  {/* Latitud - Editable */}
                  <td className="px-4 py-3 text-sm border-b font-mono whitespace-nowrap">
                    {editing ? (
                      <input
                        type="text"
                        value={getCellValue(record.id, 'lat', record.lat?.toFixed(6) || '')}
                        onChange={(e) => updateCellValue(record.id, 'lat', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="-33.456789"
                      />
                    ) : (
                      <span
                        onClick={() => startEditingCell(record.id, 'lat', record.lat?.toFixed(6) || '')}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded block text-gray-600"
                      >
                        {record.lat ? record.lat.toFixed(6) : '-'}
                      </span>
                    )}
                  </td>
                  
                  {/* Longitud - Editable */}
                  <td className="px-4 py-3 text-sm border-b font-mono whitespace-nowrap">
                    {editing ? (
                      <input
                        type="text"
                        value={getCellValue(record.id, 'lon', record.lon?.toFixed(6) || '')}
                        onChange={(e) => updateCellValue(record.id, 'lon', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="-70.654321"
                      />
                    ) : (
                      <span
                        onClick={() => startEditingCell(record.id, 'lon', record.lon?.toFixed(6) || '')}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded block text-gray-600"
                      >
                        {record.lon ? record.lon.toFixed(6) : '-'}
                      </span>
                    )}
                  </td>
                  
                  {/* Atributos dinámicos - Editables */}
                  {columns.map(col => {
                    const value = attributes[col] !== undefined ? String(attributes[col]) : '-';
                    return (
                      <td
                        key={col}
                        className="px-4 py-3 text-sm border-b whitespace-nowrap"
                      >
                        {editing ? (
                          <input
                            type="text"
                            value={getCellValue(record.id, col, value)}
                            onChange={(e) => updateCellValue(record.id, col, e.target.value)}
                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span
                            onClick={() => startEditingCell(record.id, col, value)}
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded block text-gray-900"
                          >
                            {value}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Columna de acciones - sticky right */}
                  <td className="px-4 py-3 border-b whitespace-nowrap sticky right-0 bg-inherit">
                    {editing ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => saveRowChanges(record.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                          title="Guardar cambios"
                        >
                          ✓ Guardar
                        </button>
                        <button
                          onClick={() => revertRowChanges(record.id)}
                          className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
                          title="Cancelar cambios"
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <button
                          onClick={() => startEditingCell(record.id, 'roleId', record.role?.roleId || '')}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded transition-colors"
                        >
                          ✎ Editar
                        </button>
                      </div>
                    )}
                  </td>
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
