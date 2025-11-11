// src/components/map/AddMapModal.tsx

import React, { useState } from 'react';
import { Map } from '../../types/Map.tsx';
import { useMemo } from 'react';
import { groupMapsByDepartment, getDepartmentLabel } from '../../utils/mapTransformers';
import { useCreateMap } from '../../hooks/useMaps.ts';
import type { CreateMapDto, Department } from '../../types/api.types.ts';

interface AddMapModalProps {
  isOpen: boolean;
  maps: Map[];
  onClose: () => void;
}

const AddMapModal: React.FC<AddMapModalProps> = ({ 
  isOpen, 
  onClose, 
  maps 
}) => {
  const [department, setDepartment] = useState<string>('');
  const [mapName, setMapName] = useState<string>('');
  const [attributeFields, setAttributeFields] = useState<string>('');
  const [hasRole, setHasRole] = useState<boolean>(false);

  const createMapMutation = useCreateMap();

  const groupedMaps = useMemo(() => {
    return groupMapsByDepartment(maps);
  }, [maps]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!department || !mapName || !attributeFields) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const fieldsArray = attributeFields.split('\n').map(field => field.trim()).filter(field => field);

    const newMap: Omit<CreateMapDto, 'key'> = {
      department: department as Department,
      hasRole,
      attributes: {
        name: mapName,
        fields: fieldsArray,
      },
    };

    createMapMutation.mutate(newMap as CreateMapDto, {
      onSuccess: () => {
        onClose(); // Cierra el modal en caso de éxito
        // Resetear el formulario
        setDepartment('');
        setMapName('');
        setAttributeFields('');
      },
      onError: (error) => {
        console.error("Error al crear el mapa:", error);
        alert("Hubo un error al crear el mapa. Inténtalo de nuevo.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col max-w-[60%] w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Agregar Nuevo Mapa</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={createMapMutation.isPending}
          >
            &times;
          </button>
        </div>

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
              disabled={createMapMutation.isPending}
              required
            >
              <option value="">Selecciona un departamento</option>
              {Object.keys(groupedMaps).map((dept) => {
                const capitalizedDept = dept.charAt(0).toUpperCase() + dept.slice(1);
                return (
                  <option key={capitalizedDept} value={capitalizedDept}>
                    {getDepartmentLabel(dept)}
                  </option>
                );
              })}
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
              disabled={createMapMutation.isPending}
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
              disabled={createMapMutation.isPending}
              required
            />
          </div>

          {/* Checkbox hasRole */}
          <div className="flex items-center">
            <input
              id="has-role"
              type="checkbox"
              checked={hasRole}
              onChange={(e) => setHasRole(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={createMapMutation.isPending}
            />
            <label htmlFor="has-role" className="ml-2 text-sm text-gray-700">
              Este mapa incluye Rol SII
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={createMapMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={createMapMutation.isPending || !department || !mapName || !attributeFields}
            >
              {createMapMutation.isPending ? 'Agregando...' : 'Agregar Mapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMapModal;