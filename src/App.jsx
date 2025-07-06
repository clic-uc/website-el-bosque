import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoadingPage from "./pages/LoadingPage.jsx";
import MapPage from "./pages/MapPage.jsx";

function App() {

  return (
    <BrowserRouter>
        <Routes>
            <Route index element={<LoadingPage />} />
            <Route path={"/map"} element={<MapPage />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
