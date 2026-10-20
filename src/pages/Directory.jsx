import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StudentCard from '../components/StudentCard';
import EditStudentModal from '../components/modals/EditStudentModal';
import CustomSelect from '../components/CustomSelect';
import { Search, Grid, List, Award, ChevronLeft, ChevronRight, Loader2, WifiOff, Filter, RefreshCw } from 'lucide-react';
import './Directory.css';

/**
 * ============================================================================
 * PÁGINA: Directory (Directorio de Estudiantes — Paginación Optimizada)
 * ============================================================================
 *
 * 📌 ¿QUÉ HACE ESTA PÁGINA?
 * - Muestra el directorio de estudiantes con carga LAZY (bloques de 20).
 * - Permite filtrar por sede (menú desplegable para admins).
 * - Permite buscar por Nombre, Carrera o RUT en tiempo real sobre los ya cargados.
 * - Detecta modo offline y avisa visualmente al usuario.
 * - Permite paginar localmente entre los resultados ya cargados (10 por pantalla).
 * - Muestra alerta si Firestore requiere crear un índice compuesto.
 * - Permite editar a administradores y coordinadores.
 *
 * 📌 PRINCIPIOS SOLID APLICADOS:
 *
 * 1. DIP (Inversión de Dependencias):
 *    No importa ni usa firebase/firestore directamente.
 *    Llama a `fetchStudentsPaginated()` del contexto, que centraliza Firestore.
 *
 * 2. ISP (Segregación de Interfaces):
 *    Pasa a <StudentCard> solo los datos que necesita: student y onEdit.
 *
 * 3. OCP (Abierto/Cerrado):
 *    El filtro de sede, búsqueda y vista se pueden extender sin tocar la lógica base.
 *
 * 4. SRP (Responsabilidad Única):
 *    Esta página solo gestiona UX del directorio. Los datos vienen del contexto.
 */

// Opciones de sede para el selector de admins (con opción "Todas las Sedes")
const BRANCH_OPTIONS = [
  { label: 'Todas las Sedes', options: ['Todas las Sedes'] },
  {
    label: 'Zona Norte',
    options: ['Arica', 'Iquique', 'Antofagasta', 'Copiapó']
  },
  {
    label: 'Zona Centro',
    options: ['La Serena', 'Ovalle', 'Viña del Mar', 'Rancagua', 'Curicó', 'Talca']
  },
  {
    label: 'Región Metropolitana',
    options: ['UST Santiago (Av. Ejército Libertador)', 'Santiago Centro (Vergara)', 'San Joaquín', 'Puente Alto']
  },
  {
    label: 'Zona Sur y Austral',
    options: ['Chillán', 'Concepción', 'Los Ángeles', 'Temuco', 'Valdivia', 'Osorno', 'Puerto Montt', 'Punta Arenas']
  },
  {
    label: 'Modalidad Virtual',
    options: ['Sede Online']
  }
];

// Cuántos estudiantes mostrar por pantalla en la paginación local
const ITEMS_PER_PAGE = 10;

// Cuántos estudiantes traer de Firestore en cada bloque (lazy loading)
const BLOCK_SIZE = 10000;

const Directory = () => {
  // -------------------------------------------------------------------------
  // ESTADOS LOCALES
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailablePins, setShowOnlyAvailablePins] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState(null);

  // Lista acumulada de todos los estudiantes cargados desde Firestore (por bloques)
  const [loadedStudents, setLoadedStudents] = useState([]);

  // Referencia al último documento de Firestore para usar como cursor en startAfter()
  const lastDocRef = useRef(null);

  // Estados de control de carga
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Sede seleccionada para filtrar (sólo admins pueden cambiarla)
  const [selectedBranch, setSelectedBranch] = useState('Todas las Sedes');

  // Indica si Firestore necesita que se cree un índice compuesto
  const [indexRequiredUrl, setIndexRequiredUrl] = useState(null);

  // Estado de conexión a Internet
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // -------------------------------------------------------------------------
  // CONTEXTO Y AUTENTICACIÓN (DIP — Inversión de Dependencias)
  // -------------------------------------------------------------------------
  const { user } = useAuth();
  const { fetchStudentsPaginated, updateStudent } = useData();

  // El usuario admin puede ver y filtrar todas las sedes; los demás sólo ven la suya
  const isGlobal = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'coordinador';

  // Sede efectiva para la consulta paginada
  const effectiveBranch = isGlobal ? selectedBranch : (user?.branch || null);

  // -------------------------------------------------------------------------
  // DETECCIÓN DE ESTADO OFFLINE/ONLINE
  // -------------------------------------------------------------------------
  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  // -------------------------------------------------------------------------
  // FUNCIÓN: Cargar un bloque de estudiantes de Firestore
  // -------------------------------------------------------------------------
  /**
   * Carga el siguiente bloque de BLOCK_SIZE (20000) estudiantes desde Firestore.
   * Usa el cursor `lastDocRef.current` para continuar desde donde quedó.
   * Si el filtro de sede cambia, resetea la lista antes de consultar.
   *
   * @param {boolean} reset - Si true, borra los estudiantes ya cargados y empieza desde el inicio.
   */
  const loadNextBlock = useCallback(async (reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadError(null);

    // La sede que se usa depende del rol del usuario
    const branchFilter = effectiveBranch === 'Todas las Sedes' ? null : effectiveBranch;

    try {
      const result = await fetchStudentsPaginated({
        branch: branchFilter,
        pageSize: BLOCK_SIZE,
        lastDoc: reset ? null : lastDocRef.current,
        orderByField: 'name',
        orderDirection: 'asc'
      });

      // Acumula los nuevos estudiantes (sin duplicados por ID)
      setLoadedStudents(prev => {
        const base = reset ? [] : prev;
        const existingIds = new Set(base.map(s => s.id));
        const fresh = result.students.filter(s => !existingIds.has(s.id));
        return [...base, ...fresh];
      });

      // Avanza el cursor para la próxima carga
      lastDocRef.current = result.lastVisibleDoc;
      setHasMore(result.hasMore);

      // Si Firestore detectó que falta un índice compuesto, lo avisamos
      if (result.indexRequiredUrl) {
        setIndexRequiredUrl(result.indexRequiredUrl);
      }
    } catch (err) {
      console.error("Error cargando bloque de estudiantes:", err);
      setLoadError("No se pudo cargar la lista. Verifica tu conexión o intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchStudentsPaginated, effectiveBranch, isLoading]);

  // -------------------------------------------------------------------------
  // EFECTO: Carga inicial y cuando cambia la sede seleccionada
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Resetea el cursor y la lista acumulada al cambiar la sede o al montar
    lastDocRef.current = null;
    setLoadedStudents([]);
    setHasMore(true);
    setCurrentPage(1);
    setIndexRequiredUrl(null);

    // Carga el primer bloque
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadNextBlock(true);
    // Queremos que se recargue cuando cambie la sede efectiva o cuando el user se establezca
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBranch, user?.uid]);

  // -------------------------------------------------------------------------
  // EFECTO: Resetear página cuando cambia la búsqueda
  // -------------------------------------------------------------------------
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showOnlyAvailablePins]);

  // -------------------------------------------------------------------------
  // FILTRADO LOCAL sobre los estudiantes ya cargados
  // -------------------------------------------------------------------------
  /**
   * Aplica dos filtros en memoria sobre `loadedStudents`:
   * 1. Solo pines pendientes (si el toggle está activo).
   * 2. Coincidencia de búsqueda por Nombre, Carrera, RUT o ID.
   */
  const filteredStudents = loadedStudents.filter(student => {
    // Filtro 1: solo alumnos con pines disponibles sin recolectar
    if (showOnlyAvailablePins) {
      const pendientes = (student.availablePins || []).filter(
        pinId => !(student.collectedPins || []).includes(pinId)
      );
      if (pendientes.length === 0) return false;
    }

    // Filtro 2: búsqueda por texto
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (student.name && student.name.toLowerCase().includes(term)) ||
      (student.grade && student.grade.toLowerCase().includes(term)) ||
      (student.rut && student.rut.toLowerCase().includes(term)) ||
      student.id.toLowerCase().includes(term)
    );
  });

  // -------------------------------------------------------------------------
  // PAGINACIÓN LOCAL (10 por pantalla sobre los resultados filtrados)
  // -------------------------------------------------------------------------
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  /**
   * Calcula los botones de número de página a mostrar (ventana de 5 botones)
   */
  const getVisiblePages = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // -------------------------------------------------------------------------
  // SUBCOMPONENTE: Controles de paginación local
  // -------------------------------------------------------------------------
  const PaginationControls = () => (
    <div className="pagination-controls">
      {/* Botón: Página Anterior */}
      <button
        className="page-btn nav-btn"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      >
        <ChevronLeft size={18} /> Anterior
      </button>

      {/* Botones numéricos */}
      <div className="page-numbers">
        {getVisiblePages().map(num => (
          <button
            key={num}
            className={`page-btn number-btn ${currentPage === num ? 'active' : ''}`}
            onClick={() => setCurrentPage(num)}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Botón: Página Siguiente */}
      <button
        className="page-btn nav-btn"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      >
        Siguiente <ChevronRight size={18} />
      </button>
    </div>
  );

  // -------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // -------------------------------------------------------------------------
  return (
    <div className="directory-page container">

      {/* ===== CABECERA ===== */}
      <div className="directory-header">
        <h1 className="page-title">Directorio de Estudiantes</h1>
        <p className="page-subtitle">Conoce a nuestros estudiantes y sigue su viaje.</p>

        {/* Indicador de modo Offline: aparece cuando no hay conexión a Internet */}
        {!isOnline && (
          <div className="offline-banner">
            <WifiOff size={16} />
            <span>Modo sin conexión — viendo datos en caché local</span>
          </div>
        )}

        {/* Aviso de índice compuesto requerido en Firestore */}
        {indexRequiredUrl && (
          <div className="index-warning-banner">
            <span>
              ⚠️ Firestore requiere un <strong>índice compuesto</strong> para filtrar por sede y ordenar por nombre.
              {' '}<a href={indexRequiredUrl} target="_blank" rel="noopener noreferrer">Créalo aquí con un clic</a>.
              {' '}Mientras tanto, el ordenamiento se aplica localmente.
            </span>
          </div>
        )}

        {/* ===== BARRA DE ACCIONES ===== */}
        <div className="directory-actions">

          {/* Buscador de texto */}
          <div className="search-bar glass-panel">
            <Search className="search-icon" size={20} />
            <input
              id="directory-search-input"
              type="text"
              placeholder="Buscar por nombre, RUT o carrera..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Selector de sede — sólo visible para admin */}
          {isGlobal && (
            <div className="branch-filter-wrap">
              <Filter size={16} className="branch-filter-icon" />
              <CustomSelect
                value={selectedBranch}
                onChange={val => {
                  setSelectedBranch(val);
                }}
                options={BRANCH_OPTIONS}
                placeholder="Filtrar por sede..."
              />
            </div>
          )}

          {/* Botones de filtro y modo de vista */}
          <div className="view-toggles">
            {/* Toggle: solo estudiantes con pines pendientes */}
            <button
              className={`view-btn ${showOnlyAvailablePins ? 'active' : ''}`}
              onClick={() => setShowOnlyAvailablePins(v => !v)}
              title="Solo con pines disponibles"
            >
              <Award size={20} />
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

            {/* Vista Cuadrícula */}
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista Cuadrícula"
            >
              <Grid size={20} />
            </button>

            {/* Vista Lista */}
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista Lista"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== RESUMEN DE CARGA ===== */}
      {/* ===== RESUMEN DE CARGA ===== */}
      <div className="directory-summary">
        <span className="summary-count">
          {filteredStudents.length > 0
            ? `Mostrando ${Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)} de ${filteredStudents.length} resultado(s) — ${loadedStudents.length} cargado(s) en total`
            : isLoading
              ? 'Cargando estudiantes...'
              : 'No hay resultados'}
        </span>
      </div>

      {/* ===== AVISO DE ERROR ===== */}
      {loadError && (
        <div className="load-error-banner">
          <span>{loadError}</span>
          <button className="retry-btn" onClick={() => loadNextBlock(false)}>
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      {/* ===== PAGINACIÓN SUPERIOR ===== */}
      {filteredStudents.length > 0 && <PaginationControls />}

      {/* ===== GRILLA / LISTA DE TARJETAS DE ESTUDIANTE ===== */}
      <div className={viewMode === 'grid' ? 'students-grid' : 'students-list'}>
        {currentStudents.length > 0 ? (
          currentStudents.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={canEdit ? setEditingStudent : undefined}
            />
          ))
        ) : !isLoading ? (
          <div className="no-results">
            <p>
              {searchTerm
                ? `No se encontraron estudiantes que coincidan con "${searchTerm}".`
                : 'No hay estudiantes registrados en esta sede todavía.'}
            </p>
          </div>
        ) : null}
      </div>

      {/* ===== SPINNER DE CARGA ===== */}
      {isLoading && (
        <div className="loading-block">
          <Loader2 size={28} className="spinning-icon" />
          <span>Cargando estudiantes...</span>
        </div>
      )}

      {/* ===== PAGINACIÓN INFERIOR ===== */}
      {filteredStudents.length > 0 && !isLoading && <PaginationControls />}

      {/* Mensaje final cuando ya no hay más registros que cargar */}
      {!hasMore && loadedStudents.length > 0 && !isLoading && (
        <div className="all-loaded-msg">
          ✓ Todos los estudiantes han sido cargados ({loadedStudents.length} en total).
        </div>
      )}

      {/* ===== MODAL DE EDICIÓN ===== */}
      <EditStudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onSave={updateStudent}
      />
    </div>
  );
};

export default Directory;
