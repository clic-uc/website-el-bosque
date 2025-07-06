import {FaRegTimesCircle, FaSearch} from "react-icons/fa";
import {useEffect, useRef, useState} from "react";
import {ImSpinner3} from "react-icons/im";
import {useMap} from "../MapDisplay.jsx";

const parseAddress = (address) => {
    const cityOptions = ["municipality", "city", "town", "village", "city_district", "district", "borough", "suburb", "subdivision"];

    const cityKey = Object.keys(address).find(key => cityOptions.includes(key));
    const city = cityKey ? address[cityKey] : null;

    let name;

    const road = address["road"] || null;
    const houseNumber = address["house_number"] || address["house_name"] || null;
    if (road && houseNumber) {
        name = `${road} ${houseNumber}`
    } else {
        const nameKey = Object.keys(address)[0];
        name = address[nameKey] || "Sin nombre";
    }

    return {name, city};
}

const SearchBar = () => {

    const { mapBounds, centerAt } = useMap();

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const inputRef = useRef(null);

    let timeoutId = null;
    const handleSearchChange = (e) => {

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            setSearch(e.target.value);
        }, 500);
    }

    const handleDeleteSearch = () => {
        setSearch("");
        setOptions([]);
        inputRef.current.value = "";
        inputRef.current.focus();
    }

    useEffect(() => {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${search.replace(" ", "+")}&limit=10&addressdetails=1&viewbox=${mapBounds.maxLon},${mapBounds.maxLat},${mapBounds.minLon},${mapBounds.minLat}&bounded=1&dedupe=1`;

        setLoading(true);

        fetch(url).then(response => response.json().then(
            data => {
                setLoading(false);

                setOptions(data.map(item => {
                    return {
                        lat: item.lat,
                        lon: item.lon,
                        ...parseAddress(item.address),
                    }
                }));

            }
        ))

    }, [search, mapBounds]);

    return <div className={"absolute top-5 left-5 z-10 max-h-[80%] flex flex-col gap-2"}>
        <div className={"flex rounded-full bg-white shadow-lg py-2 px-3 gap-2 items-center"}>
            <FaSearch />
            <input ref={inputRef} className={"w-[20rem] focus:outline-0"} placeholder={"Buscar"} onChange={handleSearchChange} />
            {
                loading ? <ImSpinner3 className={`animate-spin ${loading ? "" : "opacity-0"}`} /> : <FaRegTimesCircle className={`${search ? "fill-black cursor-pointer transition-colors hover:fill-gray-600" : "fill-gray-300 cursor-not-allowed"}`} onClick={handleDeleteSearch} />
            }
        </div>
        <div className={"flex flex-col rounded-2xl bg-white flex-grow overflow-auto shadow-2xl"}>
            {options.map((option, index) => (
                <div key={index} className={"py-2 px-3 hover:bg-gray-100 cursor-pointer"} onClick={() => centerAt(option.lon, option.lat)} >
                    <p className={"font-semibold"}>{option.name}</p>
                    {option.city && <p className={"text-sm text-gray-600"}>{option.city}</p>}
                </div>
            ))}
        </div>
    </div>
}

export default SearchBar;