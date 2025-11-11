import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import * as LucideIcons from 'lucide-react';

/**
 * Crea un icono de Leaflet personalizado usando un icono de Lucide
 */
export const createLucideIcon = (
  iconName?: string,
  color?: string,
  size: number = 24
): L.DivIcon => {
  // Valores por defecto
  const defaultIconName = 'building-2';
  const defaultColor = '#3b82f6'; // blue-500
  
  const finalIconName = iconName || defaultIconName;
  const finalColor = color || defaultColor;

  // Convertir kebab-case a PascalCase con prefijo Lucide
  const toPascalCase = (str: string): string => {
    if (!str) return 'Building2';
    
    return str
      .split('-')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  };

  const pascalName = toPascalCase(finalIconName);
  const IconsModule = LucideIcons as Record<string, unknown>;
  const lucideIconName = `Lucide${pascalName}`;
  const IconComponent = IconsModule[lucideIconName] || IconsModule[pascalName];

  // Renderizar el icono de Lucide como SVG string
  let iconSvg: string;
  
  if (IconComponent && typeof IconComponent === 'object' && '$$typeof' in IconComponent) {
    // Casting seguro para renderizar el componente
    const SafeIconComponent = IconComponent as React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
    iconSvg = renderToString(
      <SafeIconComponent size={size} color={finalColor} strokeWidth={2} />
    );
  } else {
    // Fallback a Building2
    iconSvg = renderToString(
      <LucideIcons.LucideBuilding2 size={size} color={finalColor} strokeWidth={2} />
    );
  }

  // Crear el HTML del marcador con el SVG
  const html = `
    <div style="
      background: white;
      border: 2px solid ${finalColor};
      border-radius: 50%;
      width: ${size + 16}px;
      height: ${size + 16}px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-lucide-marker',
    iconSize: [size + 16, size + 16],
    iconAnchor: [(size + 16) / 2, (size + 16) / 2],
    popupAnchor: [0, -(size + 16) / 2],
  });
};

/**
 * Crea un icono de Leaflet para clusters
 */
export const createClusterIcon = (
  cluster: L.MarkerCluster,
  iconName?: string,
  color?: string
): L.DivIcon => {
  const childCount = cluster.getChildCount();
  const finalColor = color || '#3b82f6';
  
  return L.divIcon({
    html: `
      <div style="
        background: ${finalColor};
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${childCount}
      </div>
    `,
    className: 'custom-cluster-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};
