import { useState, useEffect, useRef } from 'react';
import { Map } from '../../types/Map';
import { useCreateRecord } from '../../hooks/useRecords';
import { useRoles, useUpdateRole } from '../../hooks/useRoles';
import type { Role } from '../../types/api.types';

type CreateRecordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  maps: Map[];
  onMapClick?: (callback: (lat: number, lon: number) => void) => void;
  onMapClickCancel?: () => void;
};

const CreateRecordModal: React.FC<CreateRecordModalProps> = ({
  isOpen,
  onClose,
  maps,
  onMapClick,
  onMapClickCancel,
}) => {
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [lat, setLat] = useState<string>('');
  const [lon, setLon] = useState<string>('');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<string>('');
  const [links, setLinks] = useState<Array<{ title: string; url: string }>>([]);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);

  // Role state
  const [roleInput, setRoleInput] = useState<string>('');
  const [roleSearch, setRoleSearch] = useState<string>('');
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);

  const createRecordMutation = useCreateRecord();
  const updateRoleMutation = useUpdateRole();

  const selectedMap = maps.find(m => m.id === selectedMapId);

  // Debounce role search
  useEffect(() => {
    const timer = setTimeout(() => setRoleSearch(roleInput), 300);
    return () => clearTimeout(timer);
  }, [roleInput]);

  const roleSearchEnabled = !!selectedMap?.hasRole && roleSearch.length >= 1;
  const { data: rolesQueryData } = useRoles(
    { search: roleSearch, page: 1, limit: 8 },
    roleSearchEnabled,
  );
  // Backend returns paginated { data: Role[], meta: {...} }
  const roleSuggestions: Role[] = (rolesQueryData as { data?: Role[] })?.data ?? [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMapId(null);
      setLat('');
      setLon('');
      setAttributes({});
      setIsSelectingOnMap(false);
      setRoleInput('');
      setRoleSearch('');
      setShowRoleSuggestions(false);
      setSelectedRole(null);
      if (onMapClickCancel) {
        onMapClickCancel();
      }
    }
  }, [isOpen, onMapClickCancel]);

  const handleSelectOnMap = () => {
    if (!onMapClick) return;
    
    setIsSelectingOnMap(true);
    onMapClick((clickedLat: number, clickedLon: number) => {
      setLat(clickedLat.toFixed(6));
      setLon(clickedLon.toFixed(6));
      setIsSelectingOnMap(false);
    });
  };

  const handleCancelSelectOnMap = () => {
    setIsSelectingOnMap(false);
    if (onMapClickCancel) {
      onMapClickCancel();
    }
  };

  const handleSelectRole = (role: Role) => {
    setRoleInput(role.roleId);
    setSelectedRole(role);
    setShowRoleSuggestions(false);
    if (role.lat != null && role.lon != null) {
      setLat(String(role.lat));
      setLon(String(role.lon));
    }
  };

  const handleAttributeChange = (fieldName: string, value: string) => {
    setAttributes(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMapId) {
      alert('Por favor selecciona un mapa');
      return;
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      alert('Por favor ingresa coordenadas válidas');
      return;
    }

    try {
      // Crear payload sin roleId (es opcional en el backend)
      const trimmedRoleId = selectedMap?.hasRole && roleInput.trim() ? roleInput.trim() : undefined;
      const payload = {
        lat: latNum,
        lon: lonNum,
        roleId: trimmedRoleId,
        comments: comments.trim() || undefined,
        links: links.length > 0 ? links : undefined,
        recordAttributes: [
          {
            mapId: selectedMapId,
            attributes,
          },
        ],
      };
      
      await createRecordMutation.mutateAsync(payload as Parameters<typeof createRecordMutation.mutateAsync>[0]);

      // Actualizar coordenadas del rol (o crearlo si fue generado por el upsert del backend)
      if (trimmedRoleId) {
        await updateRoleMutation.mutateAsync({
          roleId: trimmedRoleId,
          dto: { lat: latNum, lon: lonNum },
        });
      }

      alert('Registro creado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error al crear registro:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al crear el registro';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
        if (response?.data?.message) {
          errorMessage = Array.isArray(response.data.message) 
            ? response.data.message.join(', ') 
            : response.data.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  if (!isOpen) return null;

  // Si está seleccionando en el mapa, mostrar solo el indicador flotante
  if (isSelectingOnMap) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000]">
        <div className="bg-blue-600 text-white rounded-lg shadow-xl px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Haz clic en el mapa para seleccionar la ubicación</span>
          </div>
          <button
            type="button"
            onClick={handleCancelSelectOnMap}
            className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] flex flex-col">
        {/* Header fijo */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Crear Nuevo Registro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selección de Mapa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mapa <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedMapId || ''}
              onChange={(e) => setSelectedMapId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un mapa</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rol (solo para mapas con hasRole) */}
          {selectedMap?.hasRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <div className="relative">
                <input
                  ref={roleInputRef}
                  type="text"
                  value={roleInput}
                  onChange={(e) => {
                    setRoleInput(e.target.value);
                    setSelectedRole(null);
                    setShowRoleSuggestions(true);
                  }}
                  onFocus={() => roleInput.length >= 1 && setShowRoleSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 150)}
                  placeholder="Ej: 00001-02024"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {roleInput.trim() && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded font-medium ${selectedRole ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {selectedRole ? 'existente' : 'nuevo'}
                  </span>
                )}
                {showRoleSuggestions && roleSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {roleSuggestions.map((role) => (
                      <li
                        key={role.roleId}
                        onMouseDown={() => handleSelectRole(role)}
                        className="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span className="font-medium truncate">{role.roleId}</span>
                        {role.lat != null && role.lon != null && (
                          <span className="flex-shrink-0 text-xs text-gray-500">📍 con coordenadas</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedRole?.lat != null && selectedRole?.lon != null && (
                <p className="mt-1 text-xs text-blue-600">
                  Coordenadas del rol cargadas automáticamente
                </p>
              )}
            </div>
          )}

          {/* Coordenadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coordenadas <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Latitud</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="-33.5626"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Longitud</label>
                  <input
                    type="text"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    placeholder="-70.6575"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleSelectOnMap}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                📍 O selecciona en el mapa
              </button>
            </div>
          </div>

          {/* Atributos del Mapa */}
          {selectedMap && Array.isArray(selectedMap.attributes) && selectedMap.attributes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Atributos
              </h3>
              <div className="space-y-3">
                {selectedMap.attributes.map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {field.name}
                    </label>
                    <input
                      type="text"
                      value={attributes[field.name] || ''}
                      onChange={(e) => handleAttributeChange(field.name, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Ingresa ${field.name.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Añade comentarios adicionales sobre este registro..."
            />
          </div>

          {/* Enlaces */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enlaces
            </label>
            <div className="space-y-3">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => {
                        const newLinks = [...links];
                        newLinks[index].title = e.target.value;
                        setLinks(newLinks);
                      }}
                      placeholder="Título del enlace"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...links];
                        newLinks[index].url = e.target.value;
                        setLinks(newLinks);
                      }}
                      placeholder="https://ejemplo.com"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newLinks = links.filter((_, i) => i !== index);
                      setLinks(newLinks);
                    }}
                    className="mt-1 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar enlace"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinks([...links, { title: '', url: '' }])}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Añadir enlace
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createRecordMutation.isPending || updateRoleMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRecordMutation.isPending
                ? 'Creando...'
                : updateRoleMutation.isPending
                ? 'Guardando rol...'
                : 'Crear Registro'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRecordModal;
