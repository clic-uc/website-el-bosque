import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoadingPage from "./pages/LoadingPage.jsx";

function App() {

  return (
    <BrowserRouter>
        <Routes>
            <Route index element={<LoadingPage />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
