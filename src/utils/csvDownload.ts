/**
 * Descarga un string CSV como archivo
 * @param csvContent - Contenido del CSV como string
 * @param fileName - Nombre del archivo (sin extensión)
 */
export function downloadCsv(csvContent: string, fileName: string): void {
  // Crear un Blob con el contenido CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Crear un enlace temporal
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  
  // Agregar al DOM, hacer clic y remover
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Liberar el URL del Blob
  URL.revokeObjectURL(url);
}

/**
 * Exporta un array de objetos como CSV
 * @param data - Array de objetos a exportar
 * @param fileName - Nombre del archivo (sin extensión)
 * @param delimiter - Delimitador de columnas (por defecto ',')
 */
export function exportArrayToCsv<T extends Record<string, any>>(
  data: T[],
  fileName: string,
  delimiter: string = ','
): void {
  if (data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Extraer headers del primer objeto
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(delimiter);

  // Convertir cada objeto a una fila CSV
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Convertir a string
      let stringValue = value == null ? '' : String(value);
      
      // Escapar comillas dobles
      stringValue = stringValue.replace(/"/g, '""');
      
      // Envolver en comillas si contiene delimitador, comillas o saltos de línea
      const needsQuotes = 
        stringValue.includes(delimiter) ||
        stringValue.includes('"') ||
        stringValue.includes('\n') ||
        stringValue.includes('\r');
      
      return needsQuotes ? `"${stringValue}"` : stringValue;
    }).join(delimiter);
  });

  // Unir todo
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  downloadCsv(csvContent, fileName);
}
