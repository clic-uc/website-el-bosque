import { MapEntity, Department } from '../types/api.types';
import { Map } from '../types/Map';

/**
 * Mapea el Department del backend al formato del frontend
 */
function mapDepartment(dept: Department): "edificacion" | "ejecucion" | "emergencias" | "vivienda" {
  switch (dept) {
    case Department.EDIFICACION:
      return "edificacion";
    case Department.EJECUCION:
      return "ejecucion";
    case Department.EMERGENCIAS:
      return "emergencias";
    case Department.VIVIENDA:
      return "vivienda";
    default:
      return "edificacion";
  }
}

/**
 * Transforma un MapEntity del backend al formato Map del frontend
 */
export function transformBackendMapToFrontend(backendMap: MapEntity): Map {
  const attributes = backendMap.attributes as Record<string, unknown>;
  
  // Extraer fields del mapa si existen
  const fields = Array.isArray(attributes?.fields) ? attributes.fields as string[] : [];
  
  // Transformar fields a Attributes del frontend
  // IMPORTANTE: Usamos el nombre del campo como ID para que coincida con las keys en ra.attributes
  const frontendAttributes = fields.map((field) => ({
    id: field, // ✅ Usar el nombre del campo como ID (no field_0, field_1...)
    name: field,
    type: "string" as const, // Por defecto string, se puede mejorar con lógica
  }));

  return {
    id: backendMap.id,
    name: (attributes?.name as string) || backendMap.key,
    department: mapDepartment(backendMap.department),
    attributes: frontendAttributes,
    hasRole: backendMap.hasRole,
    drawable: true, // Por defecto true, ajustar según necesidad
    shapeType: "point", // Por defecto point, ajustar según el tipo de mapa
    shapes: [], // Inicialmente vacío, se cargarán los records después
    layers: [], // Inicialmente vacío, se pueden agregar capas dinámicamente
  };
}

/**
 * Agrupa mapas por departamento
 */
export function groupMapsByDepartment(maps: Map[]): Record<string, Map[]> {
  return maps.reduce((acc, map) => {
    const dept = map.department;
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(map);
    return acc;
  }, {} as Record<string, Map[]>);
}

/**
 * Obtiene el nombre en español del departamento
 */
export function getDepartmentLabel(dept: string): string {
  const labels: Record<string, string> = {
    edificacion: "Edificación y Urbanismo",
    ejecucion: "Ejecución de Obras",
    emergencias: "Emergencias",
    vivienda: "Vivienda",
  };
  return labels[dept] || dept;
}
