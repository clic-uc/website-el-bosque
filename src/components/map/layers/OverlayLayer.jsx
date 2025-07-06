import OverlayShape from "./OverlayShape.jsx";

const OverlayLayer = ({z, shapes}) => {
    return <div className={`absolute top-0 left-0 w-full h-full z-${z}`}>
        {shapes.map(shape => <OverlayShape
            key={shape.id}
            {...shape}
        />)}
    </div>
}

export default OverlayLayer;