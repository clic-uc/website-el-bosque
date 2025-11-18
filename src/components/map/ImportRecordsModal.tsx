import React, {useEffect, useState} from 'react';
import { useImportRecords } from '../../hooks/useRecords';
import type { Map } from '../../types/Map';
import {ImSpinner8} from "react-icons/im";
import ColumnSelectMenu from "./ColumnSelectMenu.tsx";
import { downloadCsv } from '../../utils/csvDownload';
import type { BulkImportSummary } from '../../types/api.types';

interface ImportRecordsModalProps {
  maps: Map[];
  isOpen: boolean;
  onClose: () => void;
  fixedMapId?: number; // Si se provee, el modal estará bloqueado a ese mapa
}

const mapCsv = async (file: File, delimiter = ';', length: number = 20) => {
    const text = await file.text();

    // rowsText is a representation of the all the rows in the file (except header)
    const rowsText = text.split('\n').slice(1).join('\n');

    const total = text.split('\n').length;
    const lines = text.split('\n').slice(0, length + 1); // +1 para incluir la línea de encabezado
    const headers = lines[0].trim().split(delimiter).map(h => h.trim());
    const rows = lines.slice(1).map(line => line.trim().split(delimiter).map(value => value.trim()));
    return { headers, rows, total, rowsText };
}

const ImportRecordsModal: React.FC<ImportRecordsModalProps> = ({ maps, isOpen, onClose, fixedMapId }) => {
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<BulkImportSummary | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [headerMappings, setHeaderMappings] = useState<Record<string, string | null>>({});
  const [parsedCsv, setParsedCsv] = useState<{ headers: string[]; rows: string[][]; total: number, rowsText: string } | null>(null);
  const [delimiter, setDelimiter] = useState<string>(',');

  // Forzar el mapa seleccionado cuando se indique uno fijo
  useEffect(() => {
    if (fixedMapId) {
      setSelectedMapId(fixedMapId);
    }
  }, [fixedMapId, isOpen]);

  useEffect(() => {
      if (!selectedFile || !selectedMapId) return;
      const selectedMap = maps.find(m => m.id === selectedMapId);
      if (!selectedMap) return;
      
      const loadCsv = async () => {
          setPreviewLoading(true);
          const csv = await mapCsv(selectedFile, delimiter);
          setParsedCsv(csv);

          const newHeaderMappings: Record<string, string | null> = {};
          csv.headers.forEach(header => {
              // Try to find a matching field in the map's fields
                const matchedField = selectedMap.attributes.find(attr => attr.name.toLowerCase() === header.toLowerCase());
              newHeaderMappings[header] = matchedField?.id || null;
          });
          setHeaderMappings(newHeaderMappings);
          setPreviewLoading(false);
      }

      loadCsv();
  }, [maps, selectedFile, selectedMapId, delimiter]);

  const { mutate: importRecords, isPending, isError, error } = useImportRecords();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar extensión CSV
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrorMessage('Solo se permiten archivos CSV');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedMapId) {
      setErrorMessage('Selecciona un mapa');
      return;
    }

    if (!selectedFile || !parsedCsv) {
      setErrorMessage('Selecciona un archivo CSV');
      return;
    }

    // Rewrite CSV with mapped headers
    const csvContent = [];
    const headers = parsedCsv.headers.map(header => headerMappings[header] ? headerMappings[header] : header);
    csvContent.push(headers.join(delimiter));
    csvContent.push(parsedCsv.rowsText);
    console.log(csvContent);
    const mappedCsvFile = new File([csvContent.join('\r\n')], selectedFile.name, { type: 'text/csv' });

    importRecords(
      { mapId: selectedMapId, file: mappedCsvFile, delimiter},
      {
        onSuccess: (data) => {
          setImportResult(data);
          setErrorMessage('');
          // No cerrar automáticamente para permitir descarga de errores
        },
        onError: (err) => {
          console.error('Error importing records:', err);
          setErrorMessage(
            `Error al importar: ${err instanceof Error ? err.message : 'Error desconocido'}`
          );
        },
      }
    );
  };

  // Limpiar resultado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setImportResult(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header fijo */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Importar Registros desde CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={isPending}
          >
            &times;
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Selector de Mapa (oculto si viene fijo) */}
          {!fixedMapId && (
            <div>
              <label htmlFor="map-select" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Mapa
              </label>
              <select
                id="map-select"
                value={selectedMapId ?? ''}
                onChange={(e) => setSelectedMapId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isPending}
                required
              >
                <option value="">Selecciona un mapa</option>
                {maps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.name} ({map.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Archivo */}
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
              Archivo CSV
            </label>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
              required
            />
            {selectedFile && (
              <p className="mt-1 text-sm text-gray-600">
                Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>

          {/* Selector de delimitador */}
          <div>
            <label htmlFor="delimiter-select" className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Delimitador
            </label>
            <select
              id="delimiter-select"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
              required
            >
              <option value=",">, (Coma)</option>
              <option value=";">; (Punto y coma)</option>
            </select>
          </div>

          {/* Mensajes de Error */}
          {(errorMessage || isError) && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded-md text-sm">
              {errorMessage || error?.message || 'Error al importar'}
            </div>
          )}

          {/* Resultado de Importación */}
          {importResult && (
            <div className="bg-blue-50 border border-blue-300 rounded-md p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Resultado de la Importación</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total de filas</p>
                  <p className="text-lg font-bold text-gray-900">{importResult.totalRows}</p>
                </div>
                <div>
                  <p className="text-gray-600">Exitosas</p>
                  <p className="text-lg font-bold text-green-600">{importResult.succeeded}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fallidas</p>
                  <p className="text-lg font-bold text-red-600">{importResult.failed}</p>
                </div>
              </div>
              
              {importResult.failedRowsCsv && importResult.failed > 0 && (
                <div className="pt-2 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={() => {
                      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                      downloadCsv(importResult.failedRowsCsv!, `errores-importacion-${timestamp}`);
                    }}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Descargar filas con errores ({importResult.failed})
                  </button>
                  <p className="text-xs text-gray-600 mt-2">
                    El archivo CSV incluirá una columna "Error" con la descripción del problema en cada fila.
                  </p>
                </div>
              )}
            </div>
          )}

          {
            previewLoading && (
              <div className={"w-full flex items-center justify-center border-gray-300 border rounded-md p-2"}>
                <ImSpinner8 className={"animate-spin"} />
              </div>
            )
          }

          {
            !previewLoading && parsedCsv && headerMappings && (
              <div className={"w-full h-[300px] border-gray-300 border rounded-md p-2 overflow-auto text-sm"}>
                <div
                  className={`grid`}
                  style={{
                    gridTemplateColumns: `repeat(${parsedCsv.headers.length}, 1fr)`,
                    gridTemplateRows: `repeat(${parsedCsv.rows.length + 1}, 1fr)`
                  }}
                >
                  {
                    parsedCsv.headers.map((header, i) => {
                      const mapping = headerMappings[header];

                      return (
                        <div
                          key={`header-${header}-${i}`}
                          className={`p-2 col-start-[${i}] row-start-0 overflow-ellipsis overflow-hidden text-nowrap w-[10rem] max-w-[20rem] border-gray-200 border-b ${i < parsedCsv.headers.length - 1 ? "border-r" : ""} ${mapping ? "bg-green-100" : "bg-red-100"} flex w-full justify-between items-center`}
                        >
                          <p className={"text-wrap"}>{mapping || header}</p>
                          <ColumnSelectMenu
                            map={maps.find(m => m.id === selectedMapId)!}
                            usedAttrIds={headerMappings ? Object.values(headerMappings).filter(id => id !== null && id !== headerMappings[header]) as string[] : []}
                            selectedAttr={mapping}
                            updateSelectedAttr={(attr) => {
                              setHeaderMappings(prev => {
                                if (!attr) return {...prev, [header]: null};
                                return {...prev, [header]: attr};
                              });
                            }}
                          />
                        </div>
                      )
                    })
                  }
                  {
                    parsedCsv.rows.flatMap((row, j) => row.map((item, k) => (
                      <div
                        key={`${k}-${j}`}
                        className={`p-2 col-start-[${k}] row-start-[${j}] overflow-ellipsis overflow-hidden text-nowrap w-[10rem] max-w-[20rem] border-gray-200 border-b ${k < row.length - 1 ? "border-r" : ""}`}>
                        {item}
                      </div>
                    )))
                  }
                  {
                    parsedCsv.total > 21 && (
                      <div className={`col-start-0 col-end-[${parsedCsv.rows.length - 1}] p-2`}>
                        <p>+ {parsedCsv.total - 21} filas</p>
                      </div>
                    )
                  }
                </div>
              </div>
            )
          }

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              disabled={isPending}
            >
              {importResult ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isPending || !!importResult}
            >
              {isPending ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ImportRecordsModal;
