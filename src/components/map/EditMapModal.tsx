// src/components/map/EditMapModal.tsx

import React, { useState, useEffect } from 'react';
import { useMap, useUpdateMap } from '../../hooks/useMaps.ts';
import { Department, type UpdateMapDto } from '../../types/api.types.ts';
import { getDepartmentLabel } from '../../utils/mapTransformers.ts';

interface EditMapModalProps {
  isOpen: boolean;
  mapId: number | null;
  onClose: () => void;
}

const EditMapModal: React.FC<EditMapModalProps> = ({ 
  isOpen, 
  onClose, 
  mapId 
}) => {
  const [department, setDepartment] = useState<string>('');
  const [mapName, setMapName] = useState<string>('');
  const [attributeFields, setAttributeFields] = useState<string>('');

  const { data: map, isLoading: isLoadingMap } = useMap(mapId!);
  const updateMapMutation = useUpdateMap();

  useEffect(() => {
    if (map) {
      const mapAttributes = map.attributes as { name: string; fields: string[] };
      setDepartment(map.department);
      setMapName(mapAttributes.name || '');
      setAttributeFields((mapAttributes.fields || []).join('\n'));
    }
  }, [map]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!mapId || !department || !mapName || !attributeFields) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const fieldsArray = attributeFields.split('\n').map(field => field.trim()).filter(field => field);

    const updatedMap: UpdateMapDto = {
      department: department as Department,
      attributes: {
        name: mapName,
        fields: fieldsArray,
      },
    };

    updateMapMutation.mutate({ id: mapId, dto: updatedMap }, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        console.error("Error al actualizar el mapa:", error);
        alert("Hubo un error al actualizar el mapa. Inténtalo de nuevo.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col max-w-[60%] w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Editar Mapa</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={updateMapMutation.isPending}
          >
            &times;
          </button>
        </div>

        {isLoadingMap ? (
          <div>Cargando datos del mapa...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de Departamento */}
            <div>
              <label htmlFor="department-select" className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <select
                id="department-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={updateMapMutation.isPending}
                required
              >
                <option value="">-- Selecciona un departamento --</option>
                {Object.values(Department).map((dept) => (
                  <option key={dept} value={dept}>
                    {getDepartmentLabel(dept.toLowerCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre del Mapa */}
            <div>
              <label htmlFor="map-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Mapa
              </label>
              <input
                id="map-name"
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Obras Menores"
                disabled={updateMapMutation.isPending}
                required
              />
            </div>

            {/* Campos de Atributos */}
            <div>
              <label htmlFor="attribute-fields" className="block text-sm font-medium text-gray-700 mb-2">
                Campos de Atributos (uno por línea)
              </label>
              <textarea
                id="attribute-fields"
                value={attributeFields}
                onChange={(e) => setAttributeFields(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dirección&#10;Rol SII&#10;Propietario..."
                rows={8}
                disabled={updateMapMutation.isPending}
                required
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={updateMapMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={updateMapMutation.isPending || !department || !mapName || !attributeFields}
              >
                {updateMapMutation.isPending ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditMapModal;