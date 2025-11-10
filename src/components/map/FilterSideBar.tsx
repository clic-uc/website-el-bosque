import {useRecordsFilters} from "../../hooks/useRecords.ts";
import {useCallback, useEffect, useRef, useState} from "react";
import {FaCheck} from "react-icons/fa6";

interface FilterSideBarProps {
  isOpen: boolean;
  mapId: number;
  updateFilters: (filters: Record<string, string | string[]>) => void;
}

const FilterSideBar: React.FC<FilterSideBarProps> = ({ isOpen, mapId, updateFilters }) => {
  const {data, isLoading} = useRecordsFilters(mapId);

  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const [selectFilters, setSelectFilters] = useState<Record<string, string[]>>({});

  const clearAllFilters = useCallback(() => {
    // Clear select filters
    setSelectFilters({});
    // Clear input filters
    Object.values(inputRefs.current).forEach((input) => {
      input.value = "";
    });
  }, []);

  // Clear filters when mapId changes
  useEffect(() => {
    clearAllFilters();
  }, [mapId, clearAllFilters]);

  const saveFilters = useCallback(() => {
    const filters: Record<string, string | string[]> = {};

    // Add select filters
    Object.entries(selectFilters).forEach(([key, value]) => {
      if (value.length > 0) {
        filters[key] = value;
      }
    });

    // Add input filters
    Object.entries(inputRefs.current).forEach(([key, input]) => {
      if (input.value.trim() !== "") {
        filters[key] = input.value.trim();
      }});

    updateFilters(filters);
  }, [selectFilters, updateFilters]);

  return (
    <div className={`bg-white h-full transition-[width] ${isOpen ? 'w-[400px]' : 'w-[0]'} overflow-auto shadow-2xl`}>
      {isLoading ? (
        <div className="p-4">Cargando filtros...</div>
      ) : (
        <div className="p-4">
          <div className={"flex justify-between items-center mb-2"}>
            <p className="text-lg font-bold mb-2">Filtros</p>
            <div className={"flex gap-2"}>
              <button
                onClick={clearAllFilters}
                className="rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 flex gap-2 items-center"
              >Limpiar</button>
              <button
                onClick={saveFilters}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-2 py-1 text-sm font-medium transition-colors text-white flex gap-2 items-center"
              >Cargar</button>
            </div>
          </div>
          {data && Object.keys(data).length > 0 ? (
            Object.entries(data).map(([key, value]) => (
              <div key={key} className="mb-4 space-y-1">
                <p className="font-semibold text-sm">{key}</p>
                {Array.isArray(value) ? (
                  <div
                    className={"w-full border border-gray-300 rounded overflow-auto max-h-24"}
                  >
                    {value.map((option) => {
                      const isSelected = selectFilters[key]?.includes(option);

                      return (
                        <div
                          key={option}
                          className={`flex justify-between items-center cursor-pointer hover:bg-gray-200 px-2 py-1`}
                          onClick={() => {
                            setSelectFilters((prev) => {
                              const currentSelections = prev[key] || [];
                              let newSelections: string[];

                              if (isSelected) {
                                newSelections = currentSelections.filter((item) => item !== option);
                              } else {
                                newSelections = [...currentSelections, option];
                              }

                              return {
                                ...prev,
                                [key]: newSelections,
                              };
                            });
                          }}
                        >
                          <p>{option || '(Vacío)'}</p>
                          {isSelected && <FaCheck className={"fill-gray-500"} />}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <input
                    ref={el => {
                      if (el && inputRefs.current[key] !== el) {
                        inputRefs.current[key] = el;
                      }
                    }}
                    type={"text"}
                    className={"w-full border border-gray-300 rounded px-2 py-1"}
                    placeholder={"Ingresa un valor..."}
                  />
                )}
              </div>
            ))
          ) : (
            <p>No hay filtros disponibles para este mapa.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterSideBar;