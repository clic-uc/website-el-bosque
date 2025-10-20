import React, { useState } from 'react';
import { useImportRecords } from '../../hooks/useRecords';
import type { Map } from '../../types/Map';

interface ImportRecordsModalProps {
  maps: Map[];
  isOpen: boolean;
  onClose: () => void;
}

const ImportRecordsModal: React.FC<ImportRecordsModalProps> = ({ maps, isOpen, onClose }) => {
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { mutate: importRecords, isPending, isError, error } = useImportRecords();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar extensión CSV
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrorMessage('Solo se permiten archivos CSV');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedMapId) {
      setErrorMessage('Selecciona un mapa');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Selecciona un archivo CSV');
      return;
    }

    importRecords(
      { mapId: selectedMapId, file: selectedFile },
      {
        onSuccess: (data) => {
          alert(
            `Importación exitosa:\n` +
              `Total: ${data.totalRows}\n` +
              `Exitosos: ${data.succeeded}\n` +
              `Fallidos: ${data.failed}`
          );
          // Reset form
          setSelectedMapId(null);
          setSelectedFile(null);
          onClose();
        },
        onError: (err) => {
          console.error('Error importing records:', err);
          setErrorMessage(
            `Error al importar: ${err instanceof Error ? err.message : 'Error desconocido'}`
          );
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Importar Records desde CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={isPending}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isPending}
              required
            >
              <option value="">-- Selecciona un mapa --</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name} ({map.department})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Archivo */}
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
              Archivo CSV
            </label>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
              required
            />
            {selectedFile && (
              <p className="mt-1 text-sm text-gray-600">
                Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>

          {/* Mensajes de Error */}
          {(errorMessage || isError) && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded-md text-sm">
              {errorMessage || error?.message || 'Error al importar'}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportRecordsModal;
