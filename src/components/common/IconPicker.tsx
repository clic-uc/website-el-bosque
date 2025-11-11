import { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { X, Search } from 'lucide-react';
import IconRenderer from './IconRenderer';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string, iconColor: string) => void;
  currentIcon?: string;
  currentColor?: string;
}

// Lista de colores predefinidos con nombres descriptivos
const PRESET_COLORS = [
  { name: 'Gris', value: '#6b7280' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Amarillo', value: '#f59e0b' },
  { name: 'Púrpura', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Cian', value: '#06b6d4' },
  { name: 'Lima', value: '#84cc16' },
];

const IconPicker = ({ isOpen, onClose, onSelect, currentIcon = 'building-2', currentColor = '#6b7280' }: IconPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [customColor, setCustomColor] = useState(currentColor);

  // Actualizar estados cuando cambian las props (importante para cuando se abre el modal)
  useEffect(() => {
    setSelectedIcon(currentIcon);
    setSelectedColor(currentColor);
    setCustomColor(currentColor);
  }, [currentIcon, currentColor, isOpen]);

  // Obtener todos los iconos disponibles de Lucide
  const allIcons = useMemo(() => {
    const iconNamesSet = new Set<string>(); // Usar Set para evitar duplicados
    
    // Lista de exports que no son iconos
    const excludedKeys = new Set([
      'createLucideIcon',
      'default',
      'icons',
      'dynamicIconImports',
      'Icon'
    ]);
    
    // Usar Object.keys para iterar sobre las exportaciones del módulo
    const lucideKeys = Object.keys(LucideIcons);
    console.log(`📦 Total exports de Lucide: ${lucideKeys.length}`);
    
    lucideKeys.forEach((key) => {
      // Filtrar solo los componentes de iconos válidos
      const exportValue = (LucideIcons as Record<string, unknown>)[key];
      
      if (
        key[0] === key[0].toUpperCase() && 
        !excludedKeys.has(key) &&
        exportValue && // No null/undefined
        typeof exportValue === 'object' && // Los componentes React son objetos
        '$$typeof' in exportValue // Verificar que es un componente React
      ) {
        // Remover el prefijo "Lucide" si existe
        // LucideMailSearch -> MailSearch -> mail-search
        const iconName = key.startsWith('Lucide') ? key.slice(6) : key;
        
        // Convertir de PascalCase a kebab-case
        // Building2 -> building-2
        // ArrowRight -> arrow-right
        const kebabCase = iconName
          .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase boundaries
          .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Consecutive capitals
          .toLowerCase();
        
        // Agregar al Set (automáticamente evita duplicados)
        iconNamesSet.add(kebabCase);
      }
    });
    
    const uniqueIcons = Array.from(iconNamesSet).sort();
    console.log(`🎨 Cargados ${uniqueIcons.length} iconos únicos de Lucide`);
    
    return uniqueIcons;
  }, []);

  // Filtrar iconos por búsqueda
  const filteredIcons = useMemo(() => {
    if (!searchTerm.trim()) return allIcons;
    
    const search = searchTerm.toLowerCase();
    return allIcons.filter(icon => icon.includes(search));
  }, [allIcons, searchTerm]);

  const handleSave = () => {
    onSelect(selectedIcon, selectedColor);
    onClose();
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col m-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Seleccionar Ícono</h2>
            <p className="text-sm text-gray-500 mt-1">Elige un ícono y personaliza su color</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Vista Previa */}
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3 font-medium">Vista Previa</p>
                <div className="bg-white p-4 rounded-lg shadow-sm inline-flex">
                  <IconRenderer 
                    name={selectedIcon} 
                    color={selectedColor}
                    size={48}
                  />
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">Ícono:</p>
                <p className="font-mono text-sm font-medium text-gray-900 mb-2">{selectedIcon}</p>
                <p className="text-sm text-gray-500">Color:</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border-2 border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <p className="font-mono text-sm font-medium text-gray-900">{selectedColor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Color */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Color del Ícono</label>
            
            {/* Colores predefinidos */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  type="button"
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={`
                    p-3 rounded-lg border-2 transition-all hover:scale-105
                    ${selectedColor === color.value 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  title={color.name}
                >
                  <div 
                    className="w-full h-8 rounded"
                    style={{ backgroundColor: color.value }}
                  />
                  <p className="text-xs text-gray-600 mt-1 text-center">{color.name}</p>
                </button>
              ))}
            </div>

            {/* Color personalizado */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Color personalizado:</label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                placeholder="#000000"
                className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm flex-1 max-w-xs"
              />
            </div>
          </div>

          {/* Buscador de Iconos */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar Ícono ({filteredIcons.length} disponibles)
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre (ej: building, home, fire...)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Grid de Iconos */}
          <div className="grid grid-cols-8 gap-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
            {filteredIcons.length === 0 ? (
              <div className="col-span-8 text-center py-8 text-gray-500">
                No se encontraron iconos
              </div>
            ) : (
              filteredIcons.map((iconName) => (
                <button
                  type="button"
                  key={iconName}
                  onClick={() => {
                    console.log('Icono seleccionado:', iconName);
                    setSelectedIcon(iconName);
                  }}
                  className={`
                    p-3 rounded-lg border-2 transition-all hover:scale-110
                    ${selectedIcon === iconName 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                  title={iconName}
                >
                  <IconRenderer 
                    name={iconName} 
                    color={selectedIcon === iconName ? selectedColor : '#6b7280'}
                    size={24}
                  />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
