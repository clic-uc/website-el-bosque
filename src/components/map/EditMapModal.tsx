// src/components/map/EditMapModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useMap, useUpdateMap, useDeleteMap } from '../../hooks/useMaps.ts';
import { Department, type UpdateMapDto } from '../../types/api.types.ts';
import { getDepartmentLabel, transformBackendMapToFrontend } from '../../utils/mapTransformers.ts';
import { Palette } from 'lucide-react';
import IconPicker from '../common/IconPicker';
import IconRenderer from '../common/IconRenderer';
import ImportRecordsModal from './ImportRecordsModal';

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
  const [hasRole, setHasRole] = useState<boolean>(false);
  const [icon, setIcon] = useState<string>('building-2');
  const [iconColor, setIconColor] = useState<string>('#6b7280');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

  const { data: map, isLoading: isLoadingMap } = useMap(mapId);
  const updateMapMutation = useUpdateMap();
  const deleteMapMutation = useDeleteMap();

  useEffect(() => {
    if (map) {
      const mapAttributes = map.attributes as { name: string; fields: string[] };
      setDepartment(map.department);
      setMapName(mapAttributes.name || '');
      setAttributeFields((mapAttributes.fields || []).join('\n'));
      setHasRole(map.hasRole || false);
      setIcon(map.icon || 'building-2');
      setIconColor(map.iconColor || '#6b7280');
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
      hasRole,
      icon,
      iconColor,
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

  const handleDelete = () => {
    if (!mapId) return;

    if (window.confirm(`¿Estás seguro de que quieres eliminar el mapa "${mapName}"? Esta acción no se puede deshacer.`)) {
      deleteMapMutation.mutate(mapId, {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error al eliminar el mapa:", error);
          alert("Hubo un error al eliminar el mapa. Inténtalo de nuevo.");
        }
      });
    }
  };

  const importMaps = useMemo(() => {
    if (!map) return [] as Array<ReturnType<typeof transformBackendMapToFrontend>>;
    return [transformBackendMapToFrontend(map)];
  }, [map]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col m-auto">
        {/* Header fijo */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Editar Mapa</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
          >
            &times;
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingMap ? (
            <div className="p-6">Cargando datos del mapa...</div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
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
                disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
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
                disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
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
                disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
              />
              <label htmlFor="has-role" className="ml-2 text-sm text-gray-700">
                Este mapa incluye Rol SII
              </label>
            </div>

            {/* Editor de Ícono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícono del Mapa
              </label>
              <div className="flex items-center gap-4">
                {/* Vista previa del ícono */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-300 rounded-md">
                  <IconRenderer name={icon} color={iconColor} size={24} />
                  <div className="text-sm">
                    <p className="font-mono text-gray-900">{icon}</p>
                    <p className="text-gray-500 text-xs">{iconColor}</p>
                  </div>
                </div>
                
                {/* Botón para abrir picker */}
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2"
                  disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
                >
                  <Palette size={18} />
                  Editar Ícono
                </button>
              </div>
            </div>

            {/* Importar Registros */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importar registros
              </label>
              <p className="text-sm text-gray-600 mb-2">Carga un archivo CSV y mapea sus columnas a los atributos de este mapa.</p>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={updateMapMutation.isPending || deleteMapMutation.isPending || !mapId}
              >
                Importar CSV
              </button>
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center pt-2">
              {/* Botón de Eliminar a la izquierda */}
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
              >
                {deleteMapMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>

              {/* Botones de Cancelar y Actualizar a la derecha */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={updateMapMutation.isPending || deleteMapMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={updateMapMutation.isPending || deleteMapMutation.isPending || !department || !mapName || !attributeFields}
                >
                  {updateMapMutation.isPending ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </form>
        )}
        </div>
      </div>

      {/* Modal de selección de ícono */}
      <IconPicker
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(selectedIcon, selectedColor) => {
          setIcon(selectedIcon);
          setIconColor(selectedColor);
        }}
        currentIcon={icon}
        currentColor={iconColor}
      />

      {/* Modal de importación de registros (bloqueado a este mapa) */}
      {isImportOpen && mapId && (
        <ImportRecordsModal
          maps={importMaps as any}
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          fixedMapId={mapId}
        />
      )}
    </div>
  );
};

export default EditMapModal;