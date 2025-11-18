import { useState, useEffect } from "react";
import { AnyShape } from "../../types/Shape";

interface SearchBarProps {
  shapes?: AnyShape[];
  onResultSelect?: (shape: AnyShape) => void;
  // Props para modo tabla
  mode?: 'map' | 'table';
  onTableSearch?: (searchTerm: string) => void;
  tableSearchTerm?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  shapes = [], 
  onResultSelect,
  mode = 'map',
  onTableSearch,
  tableSearchTerm = ''
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AnyShape[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Sincronizar con el término de búsqueda de tabla cuando cambia desde fuera
  useEffect(() => {
    if (mode === 'table' && tableSearchTerm !== searchTerm) {
      setSearchTerm(tableSearchTerm);
    }
  }, [mode, tableSearchTerm, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);

    if (mode === 'table') {
      // Modo tabla: solo actualizar el término de búsqueda, sin dropdown
      onTableSearch?.(value);
      return;
    }

    // Modo mapa: búsqueda con dropdown de resultados
    if (!value.trim()) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    const searchLower = value.toLowerCase();
    
    // Buscar por roleId, dirección y otros atributos (case insensitive)
    const results = shapes.filter((shape) => {
      // Buscar en Rol SII
      const roleId = shape.attributes?.["Rol SII"] as string;
      if (roleId && roleId.toLowerCase().includes(searchLower)) return true;
      
      // Buscar en todos los atributos del shape
      if (shape.attributes) {
        return Object.entries(shape.attributes).some(([key, value]) => {
          // Excluir campos técnicos
          if (key === 'recordId' || key === 'recordAttributeId') return false;
          // Buscar en el valor del atributo
          return String(value).toLowerCase().includes(searchLower);
        });
      }
      
      return false;
    });

    setSearchResults(results.slice(0, 10)); // Limitar a 10 resultados
    setIsOpen(results.length > 0);
  };

  const handleSelectResult = (shape: AnyShape) => {
    onResultSelect?.(shape);
    setSearchTerm("");
    setSearchResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={mode === 'table' ? "Buscar en la tabla..." : "Buscar por Rol (ej: 12345-67890)..."}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSearchResults([]);
              setIsOpen(false);
              if (mode === 'table') {
                onTableSearch?.('');
              }
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown de resultados - solo en modo mapa */}
      {mode === 'map' && isOpen && searchResults.length > 0 && (
        <div className="absolute z-[2000] w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {searchResults.map((shape) => {
            const roleId = shape.attributes?.["Rol SII"] as string;
            const recordId = shape.attributes?.recordId;
            const coords = shape.type === "point" ? shape.coordinates : null;

            // Buscar qué atributo coincide con la búsqueda
            const matchedAttribute = Object.entries(shape.attributes || {}).find(([key, value]) => {
              if (key === 'recordId' || key === 'recordAttributeId' || key === 'Rol SII') return false;
              return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });

            return (
              <div
                key={shape.id}
                onClick={() => handleSelectResult(shape)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
              >
                <div className="font-semibold text-gray-800">{roleId || 'Sin Rol'}</div>
                {matchedAttribute && (
                  <div className="text-sm text-blue-600 mt-1">
                    {matchedAttribute[0]}: {String(matchedAttribute[1])}
                  </div>
                )}
                {coords && (
                  <div className="text-xs text-gray-400 mt-1">
                    📍 {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mensaje cuando no hay resultados - solo en modo mapa */}
      {mode === 'map' && isOpen && searchResults.length === 0 && searchTerm.trim() && (
        <div className="absolute z-[2000] w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No se encontraron resultados para "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;
