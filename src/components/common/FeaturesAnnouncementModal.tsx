import React from 'react';

interface FeaturesAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeaturesAnnouncementModal: React.FC<FeaturesAnnouncementModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      title: "Visualización de registros",
      status: "Completado",
      description: "Selección de capas de registros georreferenciados con visualización en mapa."
    },
    {
      title: "Clustering de Marcadores",
      status: "Completado",
      description: "Agrupación inteligente de marcadores para mejor rendimiento con datasets grandes."
    },
    {
      title: "Búsqueda por Rol SII",
      status: "Completado",
      description: "Barra de búsqueda superior que permite encontrar registros por Rol SII con zoom automático."
    },
    {
      title: "Importación CSV",
      status: "Completado",
      description: "Carga masiva de registros desde archivos CSV para cualquier mapa."
    },
    {
      title: "Panel de Atributos",
      status: "En desarrollo",
      description: "Visualización y edición de atributos de registros con validación de tipos."
    },
    {
      title: "Subdividir registros",
      status: "En desarrollo",
      description: "Dividir un record en múltiples partes manteniendo referencias."
    },
    {
      title: "Fusionar registros",
      status: "En desarrollo",
      description: "Combinar múltiples registros en uno solo preservando información."
    },
    {
      title: "Importación datos existentes",
      status: "En desarrollo",
      description: "Importar capas de datos georreferenciados existentes al sistema."
    },
    {
      title: "Importación polígonos",
      status: "En desarrollo",
      description: "Agregar polígonos de villas poblaciones y sectores."
    },
    {
      title: "Vista en Tabla",
      status: "En desarrollo",
      description: "Visualización tabular de registros con paginación y filtros avanzados."
    },
    {
      title: "Múltiples Mapas Activos",
      status: "Planificado",
      description: "Soporte para cargar registros de múltiples mapas simultáneamente."
    },
    {
      title: "Iconografía de capas",
      status: "Planificado",
      description: "Cargar iconografía personalizada de capas en el mapa."
    },
    {
      title: "Información detallada de un registro",
      status: "Planificado",
      description: "Mostrar información ampliada al seleccionar un registro en el mapa si se incluye en múltiples capas."
    },
    {
      title: "Campos adicionales para registros",
      status: "Planificado",
      description: "Agregar campo libre de texto para comentarios y campo de link a documentos externos."
    },
    {
      title: "Agregar interfaz de capas",
      status: "Planificado",
      description: "Implementar una interfaz para generar y editar capas."
    },
    {
      title: "Auditoría de cambios",
      status: "Planificado",
      description: "Registrar cambios realizados en los registros."
    },
    {
      title: "Modificar coordenadas de un registro",
      status: "Planificado",
      description: "Permitir la edición manual de las coordenadas geográficas de un registro."
    },
    {
      title: "Manejo de sesiones y roles",
      status: "Planificado",
      description: "Implementar autenticación y autorización de usuarios con roles específicos."
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[3000] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-light text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">🚀 Bienvenido a Georreferenciación DOM</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Estado de Funcionalidades</h3>
            <p className="text-sm text-gray-600">
              A continuación se detallan las funcionalidades disponibles y en desarrollo:
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 flex-1">{feature.title}</h4>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      feature.status.includes('Completado')
                        ? 'bg-green-100 text-green-700'
                        : feature.status.includes('desarrollo')
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {feature.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Info adicional */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Puedes cerrar este mensaje y seguir usando la aplicación.
              Las funcionalidades marcadas como "En desarrollo" mostrarán un aviso al intentar usarlas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesAnnouncementModal;
