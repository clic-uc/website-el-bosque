import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

const AuthPage = () => (
  <main className="flex min-h-screen w-screen items-center justify-center bg-slate-100">
    <SignedOut>
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-lg">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">DOM El Bosque</p>
          <h1 className="text-3xl font-semibold text-slate-900">Ingreso a plataforma georreferenciada</h1>
        </header>

        <div className="space-y-4">
          <SignInButton mode="modal">
            <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Iniciar sesión
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Crear cuenta
            </button>
          </SignUpButton>
        </div>
      </section>
    </SignedOut>
    <SignedIn>
      <Navigate to="/maps" replace />
    </SignedIn>
  </main>
);

export default AuthPage;
