import { SignedIn, SignedOut } from '@clerk/clerk-react';
import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MapPage from './pages/MapPage.tsx';
import AuthPage from './pages/AuthPage.tsx';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/maps"
          element={
            <>
              <SignedIn>
                <MapPage />
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
