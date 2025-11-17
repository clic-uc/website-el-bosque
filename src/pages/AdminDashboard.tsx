import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { getRoleLabel, isAdmin, useCurrentRole } from '../auth/role';
import type { Roles } from '../types/globals';
import { SearchUsers, type UserItem } from '../features/admin/SearchUsers';
import { RoleActions } from '../features/admin/RoleActions';
import { apiClient } from '../lib/api-client';

type Feedback = { type: 'info' | 'error'; message: string };

type AuditLog = {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'REVERT';
  entityType: 'MAP' | 'RECORD' | 'ROLE' | 'RECORD_ATTRIBUTE';
  entityId: string;
  timestamp: string;
  metadata: Record<string, any>;
};

type ImportBatch = {
  id: string;
  mapId: number;
  userId: string;
  fileName: string;
  totalRecords: number;
  succeededRecords: number;
  failedRecords: number;
  status: 'COMPLETED' | 'REVERTED';
  importedAt: string;
  revertedAt?: string;
};

type RosterResponse = {
  data: UserItem[];
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    nextOffset?: number;
    prevOffset?: number;
  };
};

type PaginationState = {
  total?: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
  nextOffset?: number;
  prevOffset?: number;
};

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  IMPORT: 'Importación',
  REVERT: 'Reversión',
};

const ENTITY_LABELS: Record<string, string> = {
  MAP: 'Mapa',
  RECORD: 'Registro',
  ROLE: 'Rol',
  RECORD_ATTRIBUTE: 'Atributo',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-50 border-green-200 text-green-700',
  UPDATE: 'bg-blue-50 border-blue-200 text-blue-700',
  DELETE: 'bg-red-50 border-red-200 text-red-700',
  IMPORT: 'bg-purple-50 border-purple-200 text-purple-700',
  REVERT: 'bg-orange-50 border-orange-200 text-orange-700',
};

export default function AdminDashboard() {
  const { isLoaded, user } = useUser();
  const role = useCurrentRole();
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [auditView, setAuditView] = useState<'logs' | 'imports'>('logs');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [viewState, setViewState] = useState<'roster' | 'search'>('roster');
  const [searchSession, setSearchSession] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [importsPage, setImportsPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalImports, setTotalImports] = useState(0);

  const fetchRoster = useCallback(async (requestedOffset = 0) => {
    setLoading(true);
    setFeedback(null);
    setViewState('roster');
    try {
      const { data: response } = await apiClient.get<RosterResponse>(
        `/admin/users/all?limit=${PAGE_SIZE}&offset=${requestedOffset}`,
      );

      const meta = response.meta ?? {};
      const resolvedMeta: PaginationState = {
        limit:
          typeof meta.limit === 'number' && !Number.isNaN(meta.limit)
            ? meta.limit
            : PAGE_SIZE,
        offset:
          typeof meta.offset === 'number' && !Number.isNaN(meta.offset)
            ? meta.offset
            : requestedOffset,
        total:
          typeof meta.total === 'number' && !Number.isNaN(meta.total)
            ? meta.total
            : undefined,
        hasMore:
          'hasMore' in meta
            ? Boolean((meta as { hasMore?: boolean }).hasMore)
            : undefined,
        nextOffset:
          typeof meta.nextOffset === 'number' && !Number.isNaN(meta.nextOffset)
            ? meta.nextOffset
            : undefined,
        prevOffset:
          typeof meta.prevOffset === 'number' && !Number.isNaN(meta.prevOffset)
            ? meta.prevOffset
            : undefined,
      };

      setUsers(response.data);
      setPagination(resolvedMeta);
    } catch (error) {
      console.error('[Admin] Failed to fetch roster', error);
      setFeedback({
        type: 'error',
        message:
          'No pudimos cargar el listado general. Intenta nuevamente en unos segundos.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ data: AuditLog[]; total: number }>(
        `/audit/logs?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
      );
      setLogs(data.data);
      setTotalLogs(data.total);
    } catch (error) {
      console.error('[Audit] Failed to fetch logs', error);
      setFeedback({
        type: 'error',
        message: 'No se pudieron cargar los logs de auditoría.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchImports = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ data: ImportBatch[]; total: number }>(
        `/audit/imports?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
      );
      setImports(data.data);
      setTotalImports(data.total);
    } catch (error) {
      console.error('[Audit] Failed to fetch imports', error);
      setFeedback({
        type: 'error',
        message: 'No se pudieron cargar las importaciones.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRevertImport = async (batchId: string) => {
    if (!confirm('¿Estás seguro de que quieres revertir esta importación? Esta acción eliminará todos los registros importados.')) {
      return;
    }

    try {
      await apiClient.delete(`/audit/imports/${batchId}`);
      await fetchImports(importsPage);
      setFeedback({
        type: 'info',
        message: 'Importación revertida exitosamente.',
      });
    } catch (error) {
      console.error('[Audit] Failed to revert import', error);
      setFeedback({
        type: 'error',
        message: 'Error al revertir la importación.',
      });
    }
  };

  useEffect(() => {
    // Opción B: no ejecutar peticiones hasta que Clerk esté cargado
    if (!isLoaded) return;
    setFeedback(null);
    if (activeTab === 'users') {
      void fetchRoster(0);
    } else if (activeTab === 'audit') {
      if (auditView === 'logs') {
        void fetchLogs(logsPage);
      } else {
        void fetchImports(importsPage);
      }
    }
  }, [isLoaded, activeTab, auditView, logsPage, importsPage, fetchRoster, fetchLogs, fetchImports]);

  const handleRoleChange = (userId: string, nextRole: Roles | null) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              role: nextRole,
            }
          : user,
      ),
    );

    setFeedback({
      type: 'info',
      message: nextRole
        ? `El rol se actualizó a "${getRoleLabel(nextRole)}".`
        : 'El rol fue removido correctamente.',
    });
  };

  const handleResetRoster = () => {
    setSearchSession((prev) => prev + 1);
    void fetchRoster(0);
  };

  const resolvedPagination: PaginationState = pagination ?? {
    limit: PAGE_SIZE,
    offset: 0,
  };
  const { limit, offset, total, hasMore, nextOffset, prevOffset } =
    resolvedPagination;

  const canGoPrev = viewState === 'roster' && offset > 0;
  const computedNextOffset = nextOffset ?? offset + limit;
  const computedPrevOffset = prevOffset ?? Math.max(offset - limit, 0);
  const canGoNext =
    viewState === 'roster' &&
    (typeof hasMore === 'boolean'
      ? hasMore
      : total !== undefined
      ? offset + limit < total
      : users.length >= limit);

  const showingStart = offset + 1;
  const showingEnd = offset + users.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const auditTotalPages = auditView === 'logs' 
    ? Math.ceil(totalLogs / PAGE_SIZE)
    : Math.ceil(totalImports / PAGE_SIZE);
  
  const auditCurrentPage = auditView === 'logs' ? logsPage : importsPage;
  const setAuditCurrentPage = auditView === 'logs' ? setLogsPage : setImportsPage;

  // Esperar a que Clerk cargue completamente el usuario y su rol
  if (!isLoaded || (user && role === null)) {
    return (
      <main className="flex min-h-screen w-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <p className="text-lg text-gray-700">Cargando...</p>
          <p className="text-sm text-gray-500 mt-2">Verificando permisos...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <main className="flex min-h-screen w-screen items-center justify-center bg-slate-100 px-4">
          <p className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700 shadow-sm">
            Debes iniciar sesión para acceder a este panel.
          </p>
        </main>
      </SignedOut>

      <SignedIn>
        {!isAdmin(role) ? (
          <main className="flex min-h-screen w-screen items-center justify-center bg-slate-100 px-4">
            <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
              <h1 className="text-2xl font-semibold text-slate-900">
                Sin acceso
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Esta sección es exclusiva para perfiles administradores. Si
                crees que es un error, comunícate con el equipo gestor.
              </p>
              <Link
                to="/maps"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Volver al mapa
              </Link>
            </section>
          </main>
        ) : (
          <main className="min-h-screen w-screen bg-slate-100 text-slate-900 overflow-y-auto">
            <div className="mx-auto flex max-w-5xl flex-col px-6 py-12 pb-12 lg:px-8">
              <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Municipalidad de El Bosque
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Panel de administración
                  </h1>
                  <p className="text-sm text-slate-600">
                    {activeTab === 'users' 
                      ? 'Gestiona los roles de los equipos vinculados al portal territorial.'
                      : 'Visualiza todas las acciones realizadas en el sistema.'}
                  </p>
                </div>
                <Link
                  to="/maps"
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Volver al mapa
                </Link>
              </header>

              {/* Tabs principales */}
              <div className="mb-6 flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gestión de usuarios
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'audit'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Auditoría
                </button>
              </div>

              {activeTab === 'users' && (
              <>
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Buscar personas
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Utiliza nombre o correo para localizar a la persona que
                      necesitas actualizar.
                    </p>
                  </div>

                  <SearchUsers
                    key={searchSession}
                    onResults={(results) => {
                      setUsers(results);
                      setViewState('search');
                      setPagination(null);

                      if (results.length === 0) {
                        setFeedback({
                          type: 'info',
                          message:
                            'No encontramos resultados para esa búsqueda.',
                        });
                      } else {
                        setFeedback(null);
                      }
                    }}
                    loading={loading}
                    setLoading={setLoading}
                    onSearchStart={() => {
                      setFeedback(null);
                    }}
                    onError={(message) => {
                      setFeedback({ type: 'error', message });
                    }}
                  />

                  {feedback ? (
                    <div
                      className={[
                        'rounded-xl px-4 py-3 text-sm',
                        feedback.type === 'error'
                          ? 'border border-red-200 bg-red-50 text-red-700'
                          : 'border border-blue-100 bg-blue-50 text-blue-700',
                      ].join(' ')}
                    >
                      {feedback.message}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="mt-10 flex-1 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {viewState === 'search'
                      ? 'Resultados de la búsqueda'
                      : 'Listado general'}
                  </h2>
                  {viewState === 'search' ? (
                    <button
                      type="button"
                      onClick={handleResetRoster}
                      className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Ver listado general
                    </button>
                  ) : null}
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
                    Cargando usuarios...
                  </div>
                ) : null}

                {!loading && users.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No hay usuarios disponibles en este momento.
                  </p>
                ) : null}

                <div className="grid gap-4">
                  {users.map((user) => {
                    const fullName =
                      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                      'Sin nombre';
                    const roleLabel = getRoleLabel(user.role);

                    return (
                      <article
                        key={user.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {fullName}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {user.email ?? 'Sin correo registrado'}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
                            {roleLabel}
                          </span>
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <RoleActions
                            user={user}
                            onChanged={(nextRole) =>
                              handleRoleChange(user.id, nextRole)
                            }
                            onError={(message) =>
                              setFeedback({ type: 'error', message })
                            }
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                {viewState === 'roster' && users.length > 0 ? (
                  <footer className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      Mostrando {showingStart}-{showingEnd}
                      {total !== undefined ? ` de ${total}` : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchRoster(computedPrevOffset)}
                        disabled={!canGoPrev}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchRoster(computedNextOffset)}
                        disabled={!canGoNext}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </footer>
                ) : null}
              </section>
              </>
              )}

              {/* Vista de Auditoría */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  {/* Sub-tabs de auditoría */}
                  <div className="flex gap-2 border-b border-slate-200">
                    <button
                      onClick={() => setAuditView('logs')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        auditView === 'logs'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Logs de auditoría
                    </button>
                    <button
                      onClick={() => setAuditView('imports')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        auditView === 'imports'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Importaciones
                    </button>
                  </div>

                  {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
                      Cargando...
                    </div>
                  ) : null}

                  {/* Logs Tab */}
                  {auditView === 'logs' && !loading && (
                    <div className="space-y-4">
                      {!logs || logs.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No hay logs de auditoría disponibles.
                        </p>
                      ) : (
                        logs.map((log) => (
                          <article
                            key={log.id}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${ACTION_COLORS[log.action]}`}>
                                  {ACTION_LABELS[log.action]}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {ENTITY_LABELS[log.entityType]} #{log.entityId}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                Usuario: <span className="font-mono text-xs">{log.userId}</span>
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDate(log.timestamp)}
                              </p>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700">
                                    Ver detalles
                                  </summary>
                                  <pre className="mt-2 rounded-lg bg-slate-50 p-3 text-xs overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  )}

                  {/* Imports Tab */}
                  {auditView === 'imports' && !loading && (
                    <div className="space-y-4">
                      {!imports || imports.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No hay importaciones registradas.
                        </p>
                      ) : (
                        imports.map((batch) => (
                          <article
                            key={batch.id}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-base font-semibold text-slate-900">
                                    {batch.fileName}
                                  </h3>
                                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${
                                    batch.status === 'COMPLETED'
                                      ? 'bg-green-50 border-green-200 text-green-700'
                                      : 'bg-red-50 border-red-200 text-red-700'
                                  }`}>
                                    {batch.status === 'COMPLETED' ? 'Completada' : 'Revertida'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                  <p>Mapa ID: {batch.mapId}</p>
                                  <p>Total: {batch.totalRecords} registros</p>
                                  <p>Exitosos: {batch.succeededRecords}</p>
                                  <p>Fallidos: {batch.failedRecords}</p>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                  Importado: {formatDate(batch.importedAt)}
                                </p>
                                {batch.revertedAt && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Revertido: {formatDate(batch.revertedAt)}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                  Usuario: <span className="font-mono">{batch.userId}</span>
                                </p>
                              </div>
                              {batch.status === 'COMPLETED' && (
                                <button
                                  onClick={() => handleRevertImport(batch.id)}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  Revertir importación
                                </button>
                              )}
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  )}

                  {/* Paginación de auditoría */}
                  {!loading && ((auditView === 'logs' && logs && logs.length > 0) || (auditView === 'imports' && imports && imports.length > 0)) && (
                    <footer className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                      <div>
                        Página {auditCurrentPage + 1} de {auditTotalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAuditCurrentPage(Math.max(0, auditCurrentPage - 1))}
                          disabled={auditCurrentPage === 0}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setAuditCurrentPage(auditCurrentPage + 1)}
                          disabled={auditCurrentPage >= auditTotalPages - 1}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    </footer>
                  )}
                </div>
              )}
            </div>
          </main>
        )}
      </SignedIn>
    </>
  );
}
