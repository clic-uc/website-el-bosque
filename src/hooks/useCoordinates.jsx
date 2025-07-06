const useCoordinates = () => {

    const degToRad = (deg) => {
        return deg * (Math.PI / 180);
    }

    const lon2x = (lon) => {
        return degToRad(lon);
    }

    const lat2y = (lat) => {
        return Math.log(Math.tan((Math.PI / 4) + (degToRad(lat) / 2)));
    }

    const getTile = (lon, lat, zoom) => {
        const tiles = Math.pow(2, zoom);

        const x = Math.floor((lon2x(lon) + Math.PI) * tiles / (2 * Math.PI));
        const y = Math.floor((Math.PI - lat2y(lat)) * tiles / (2 * Math.PI));

        return { x, y };
    }

    const getXYCoordinates = (lon, lat, zoom) => {
        const tiles = Math.pow(2, zoom);

        const x = (lon2x(lon) + Math.PI) * tiles / (2 * Math.PI);
        const y = (Math.PI - lat2y(lat)) * tiles / (2 * Math.PI);
        return { x, y };
    }

    const getTileUrl = (x, y, z) => {
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