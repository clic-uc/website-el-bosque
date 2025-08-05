export type GeoPosition = {
    lon: number;
    lat: number;
}

export type XYPosition = {
    x: number;
    y: number;
}

const useCoordinates = () => {

    const degToRad = (deg: number) => {
        return deg * (Math.PI / 180);
    }

    const lon2x = (lon: number) => {
        return degToRad(lon);
    }

    const lat2y = (lat: number) => {
        return Math.log(Math.tan((Math.PI / 4) + (degToRad(lat) / 2)));
    }

    const getTile = (lon: number, lat: number, zoom: number): XYPosition => {
        const tiles = Math.pow(2, zoom);

        const x = Math.floor((lon2x(lon) + Math.PI) * tiles / (2 * Math.PI));
        const y = Math.floor((Math.PI - lat2y(lat)) * tiles / (2 * Math.PI));

        return { x, y };
    }

    const getXYCoordinates = (lon: number, lat: number, zoom: number): XYPosition => {
        const tiles = Math.pow(2, zoom);

        const x = (lon2x(lon) + Math.PI) * tiles / (2 * Math.PI);
        const y = (Math.PI - lat2y(lat)) * tiles / (2 * Math.PI);
        return { x, y };
    }

    const getTileUrl = (x: number, y: number, z: number) => {
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }

    return {
        getTile,
        getTileUrl,
        lon2x,
        lat2y,
        getXYCoordinates
    }
}

export default useCoordinates;