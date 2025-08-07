// No estoy seguro si modelar la configuración así, luego cambiar si es necesario
export const useConfig = () => {
    return {
        mapBounds: {
            minLongitude: -70.75860376620324,
            maxLongitude: -70.64506335632365,
            minLatitude: -33.59220524202586,
            maxLatitude: -33.5314107698844,
        },
        mapUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    }
}