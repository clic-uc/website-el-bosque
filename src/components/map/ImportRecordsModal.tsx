import React, {useEffect, useState} from 'react';
import { useImportRecords } from '../../hooks/useRecords';
import type { Map } from '../../types/Map';
import {ImSpinner8} from "react-icons/im";
import ColumnSelectMenu from "./ColumnSelectMenu.tsx";

interface ImportRecordsModalProps {
  maps: Map[];
  isOpen: boolean;
  onClose: () => void;
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

const ImportRecordsModal: React.FC<ImportRecordsModalProps> = ({ maps, isOpen, onClose }) => {
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [headerMappings, setHeaderMappings] = useState<Record<string, string | null>>({});
  const [parsedCsv, setParsedCsv] = useState<{ headers: string[]; rows: string[][]; total: number, rowsText: string } | null>(null);

  useEffect(() => {
      if (!selectedFile || !selectedMapId) return;
      const selectedMap = maps.find(m => m.id === selectedMapId);
      if (!selectedMap) return;
      
      const loadCsv = async () => {
          setPreviewLoading(true);
          const csv = await mapCsv(selectedFile);
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
  }, [maps, selectedFile, selectedMapId]);

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
    csvContent.push(headers.join(';'));
    csvContent.push(parsedCsv.rowsText);
    const mappedCsvFile = new File([csvContent.join('\n')], selectedFile.name, { type: 'text/csv' });

    importRecords(
      { mapId: selectedMapId, file: mappedCsvFile },
      {
        onSuccess: (data) => {
          alert(
            `Importación exitosa:\n` +
              `Total: ${data.totalRows}\n` +
              `Exitosos: ${data.succeeded}\n` +
              `Fallidos: ${data.failed}`
          );
          // Reset form
          setSelectedMapId(null);
          setSelectedFile(null);
          onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col max-w-[60%]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Importar Records desde CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={isPending}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Mapa */}
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
              <option value="">-- Selecciona un mapa --</option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name} ({map.department})
                </option>
              ))}
            </select>
          </div>

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

          {/* Mensajes de Error */}
          {(errorMessage || isError) && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded-md text-sm">
              {errorMessage || error?.message || 'Error al importar'}
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
                          {mapping || header}
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
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportRecordsModal;
