import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import MapPage from "./pages/MapPage.tsx";

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
