import React, { useState } from 'react';

interface CoordinateUpdateModalProps {
  isOpen: boolean;
  recordId: number;
  roleSII?: string;
  oldCoordinates: { lat: number; lon: number };
  newCoordinates: { lat: number; lon: number };
  onConfirm: (updateRelatedRecords: boolean) => void;
  onCancel: () => void;
}

const CoordinateUpdateModal: React.FC<CoordinateUpdateModalProps> = ({
  isOpen,
  recordId,
  roleSII,
  oldCoordinates,
  newCoordinates,
  onConfirm,
  onCancel,
}) => {
  const [updateRelatedRecords, setUpdateRelatedRecords] = useState(false);

  if (!isOpen) return null;

  const hasRole = roleSII && roleSII.trim() !== '';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Confirmar cambio de coordenadas
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            {hasRole && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Rol SII:</span> {roleSII}
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Coordenadas anteriores:</p>
              <p className="text-sm font-mono text-gray-700">
                {oldCoordinates.lat.toFixed(6)}, {oldCoordinates.lon.toFixed(6)}
              </p>
            </div>
            <div className="flex justify-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Coordenadas nuevas:</p>
              <p className="text-sm font-mono text-blue-600">
                {newCoordinates.lat.toFixed(6)}, {newCoordinates.lon.toFixed(6)}
              </p>
            </div>
          </div>

          {hasRole && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="updateRelated"
                checked={updateRelatedRecords}
                onChange={(e) => setUpdateRelatedRecords(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="updateRelated" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">Actualizar todos los registros con el mismo rol</span>
                <p className="text-xs text-gray-600 mt-1">
                  Esta opción actualizará las coordenadas de todos los registros que comparten el rol <span className="font-mono">{roleSII}</span>
                </p>
              </label>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(updateRelatedRecords)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirmar cambio
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoordinateUpdateModal;
