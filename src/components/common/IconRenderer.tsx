import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconRendererProps extends Omit<LucideProps, 'ref'> {
  name?: string;
  color?: string;
  size?: number;
  className?: string;
}

/**
 * Componente para renderizar iconos de Lucide dinámicamente por nombre
 * Fallback a Building2 si el icono no existe
 */
const IconRenderer = ({ 
  name = 'building-2', 
  color = '#6b7280', 
  size = 20,
  className = '',
  ...props 
}: IconRendererProps) => {
  // Convertir nombre de kebab-case a PascalCase
  // Ejemplo: "building-2" -> "Building2"
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

  const iconName = toPascalCase(name);
  
  // Obtener el componente del icono de forma segura
  // Los iconos en Lucide React tienen el prefijo "Lucide"
  const IconsModule = LucideIcons as Record<string, unknown>;
  const lucideIconName = `Lucide${iconName}`;
  const IconComponent = IconsModule[lucideIconName] || IconsModule[iconName];

  // Validar que IconComponent es realmente un componente antes de renderizar
  if (!IconComponent) {
    console.warn(`⚠️ Icono "${name}" (${iconName} / ${lucideIconName}) no encontrado, usando Building2`);
    return (
      <LucideIcons.Building2 
        size={size} 
        color={color}
        className={className}
        strokeWidth={2}
        {...props}
      />
    );
  }

  // Casting seguro ya que validamos que es una función
  const SafeIconComponent = IconComponent as React.ComponentType<LucideProps>;

  return (
    <SafeIconComponent 
      size={size} 
      color={color}
      className={className}
      strokeWidth={2}
      {...props}
    />
  );
};

export default IconRenderer;
