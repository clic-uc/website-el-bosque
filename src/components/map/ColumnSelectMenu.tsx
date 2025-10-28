import type { Map } from '../../types/Map';
import {autoUpdate, flip, offset, useDismiss, useFloating, useInteractions} from "@floating-ui/react";
import {HiDotsVertical} from "react-icons/hi";
import {useState} from "react";

interface ColumnSelectMenuProps {
  map: Map;
  usedAttrIds: string[];
  selectedAttr: string | null;
  updateSelectedAttr: (attr: string | null) => void;
}

const ColumnSelectMenu: React.FC<ColumnSelectMenuProps> = ({
  map, usedAttrIds, selectedAttr, updateSelectedAttr,
}) => {

  const [menuOpen, setMenuOpen] = useState(false);

  const menuFloating = useFloating({
    placement: "top",
    middleware: [offset(10), flip()],
    whileElementsMounted: autoUpdate,
    open: menuOpen,
    onOpenChange: setMenuOpen,
  });

  const floatingDismiss = useDismiss(menuFloating.context, {
    outsidePress: true,
    ancestorScroll: true,
  });

  const floatingInteractions = useInteractions([floatingDismiss])

  return (
    <>
      {
        menuOpen && (
          <div
            className={`p-1 max-h-[10rem] w-[10rem] overflow-auto flex flex-col gap-1 bg-white border-gray-300 border rounded-md`}
            ref={menuFloating.refs.setFloating}
            style={menuFloating.floatingStyles}
            {...floatingInteractions.getFloatingProps()}
          >
            {
              map.attributes.map((attribute, i) => {
                return (
                  <div
                    key={`${attribute.id}-${i}`}
                    className={`p-1 ${usedAttrIds.includes(attribute.id) ? "cursor-not-allowed text-gray-500" : "hover:bg-gray-200 cursor-pointer"} ${selectedAttr === attribute.id ? "bg-green-200 font-bold" : ""} rounded-sm transition-colors`}
                    onClick={() => {
                      if (!usedAttrIds.includes(attribute.id)) {
                        updateSelectedAttr(attribute.id === selectedAttr ? null : attribute.id);
                        setMenuOpen(false);
                      }
                    }}
                  >
                    {attribute.name}
                  </div>
                )
              })
            }
          </div>
        )
      }
      <div
        className={`p-1 aspect-square ${selectedAttr ? "hover:bg-green-200" : "hover:bg-red-200"} transition-colors cursor-pointer rounded-full`}
        ref={menuFloating.refs.setReference}
        onClick={() => setMenuOpen(prev => !prev)}
        {...floatingInteractions.getReferenceProps()}
      >
        <HiDotsVertical />
      </div>
    </>
  )

}

export default ColumnSelectMenu;