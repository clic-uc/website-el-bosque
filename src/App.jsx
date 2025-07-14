import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import MapPage from "./pages/MapPage.jsx";

function App() {

  return (
    <BrowserRouter>
        <Routes>
            <Route index element={<MapPage />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
