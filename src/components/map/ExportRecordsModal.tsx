import React, { useMemo, useState } from 'react';
import type { Map } from '../../types/Map';
import type { GeographicalRecord } from '../../types/api.types';
import { recordsService } from '../../services/api.service';
import { exportArrayToCsv } from '../../utils/csvDownload';

interface ExportRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maps: Map[];
}

const ExportRecordsModal: React.FC<ExportRecordsModalProps> = ({ isOpen, onClose, maps }) => {
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [delimiter, setDelimiter] = useState<string>(',');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedMap = useMemo(() => maps.find(m => m.id === selectedMapId) || null, [maps, selectedMapId]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setErrorMessage('');

    if (!selectedMapId) {
      setErrorMessage('Selecciona un mapa');
      return;
    }

    setIsExporting(true);
    try {
      // Obtener todos los registros asociados al mapa
      const records = await recordsService.getAll({ mapId: selectedMapId });

      // Preparar columnas
      const baseHeaders: string[] = ['id'];
      if (selectedMap?.hasRole) baseHeaders.push('roleId');
      baseHeaders.push('lat', 'lon');

      const attributeFields: string[] = Array.isArray(selectedMap?.attributes)
        ? selectedMap!.attributes.map(a => a.name)
        : [];

      const headers = [...baseHeaders, ...attributeFields];

      // Transformar records a objetos planos con columnas definidas
      const rows = (records as GeographicalRecord[]).map((record) => {
        const row: Record<string, unknown> = {};
        row.id = record.id;
        if (selectedMap?.hasRole) row.roleId = record.role?.roleId ?? '';
        row.lat = record.lat ?? '';
        row.lon = record.lon ?? '';

        const ra = record.recordAttributes?.find((r) => r.mapId === selectedMapId);
        const attrs = (ra?.attributes as Record<string, unknown>) || {};

        attributeFields.forEach((field) => {
          const v = attrs[field];
          row[field] = v == null ? '' : String(v);
        });

        return row;
      });

      // Asegurar el orden de columnas en el CSV
      const orderedRows = rows.map((row) => {
        const ordered: Record<string, unknown> = {};
        headers.forEach((h) => {
          ordered[h] = row[h] ?? '';
        });
        return ordered;
      });

      const mapNameSafe = (selectedMap?.name || 'mapa').replace(/[^a-zA-Z0-9_-]+/g, '-');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `export-${mapNameSafe}-${timestamp}`;

      exportArrayToCsv(orderedRows, filename, delimiter);
      onClose();
    } catch (err) {
      console.error('Error exportando CSV:', err);
      setErrorMessage('Error al exportar los datos. Inténtalo nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col m-auto">
        {/* Header fijo */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Exportar Registros a CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={isExporting}
          >
            &times;
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Selector de Mapa */}
            <div>
              <label htmlFor="map-select" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Mapa
              </label>
              <select
                id="map-select"
                value={selectedMapId ?? ''}
                onChange={(e) => setSelectedMapId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isExporting}
                required
              >
                <option value="">Selecciona un mapa</option>
                {maps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.name} ({map.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de delimitador */}
            <div>
              <label htmlFor="delimiter-select" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Delimitador
              </label>
              <select
                id="delimiter-select"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isExporting}
                required
              >
                <option value=",">, (Coma)</option>
                <option value=";">; (Punto y coma)</option>
              </select>
            </div>

            {/* Info de columnas */}
            {selectedMap && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                <p className="text-gray-700 font-medium mb-1">Columnas incluidas:</p>
                <p className="text-gray-700">id{selectedMap.hasRole ? ', roleId' : ''}, lat, lon{selectedMap.attributes?.length ? `, ${selectedMap.attributes.map(a => a.name).join(', ')}` : ''}</p>
              </div>
            )}

            {/* Mensajes de Error */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded-md text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end items-center gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            disabled={isExporting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isExporting || !selectedMapId}
          >
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportRecordsModal;
