import { FormEvent, useState } from 'react';
import { apiGet } from '../../lib/api';

export type UserItem = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
};

type SearchUsersProps = {
  onResults: (users: UserItem[]) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  onSearchStart?: () => void;
  onError?: (message: string) => void;
};

export function SearchUsers({
  onResults,
  loading,
  setLoading,
  onSearchStart,
  onError,
}: SearchUsersProps) {
  const [query, setQuery] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    onSearchStart?.();
    setLoading(true);

    try {
      const { data } = await apiGet<{ data: UserItem[] }>(
        `/admin/users?search=${encodeURIComponent(trimmed)}`,
      );
      onResults(data);
    } catch (error) {
      console.error('[Admin] Failed to search users', error);
      onError?.('No pudimos obtener los usuarios. Intenta nuevamente en unos segundos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="search" className="sr-only">
        Buscar usuarios
      </label>
      <input
        id="search"
        placeholder="Buscar usuarios (nombre o correo)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  );
}
