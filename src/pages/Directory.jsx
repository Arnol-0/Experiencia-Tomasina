import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StudentCard from '../components/StudentCard';
import EditStudentModal from '../components/modals/EditStudentModal';
import CustomSelect from '../components/CustomSelect';
import { Search, Grid, List, Award, ChevronLeft, ChevronRight, WifiOff, Filter } from 'lucide-react';
import { isGlobalUser, canManageStudents } from '../utils/permissions';
import { buildCredentialsMap } from '../utils/credentials';
import { branchOptions as CANONICAL_BRANCH_OPTIONS } from '../constants/branches';
import './Directory.css';

/**
 * ============================================================================
 * PÁGINA: Directory (Directorio de Estudiantes — Tiempo Real y Carga Ultrarrápida)
 * ============================================================================
 *
 * 📌 ¿QUÉ HACE ESTA PÁGINA?
 * - Muestra el directorio completo de estudiantes sincronizado en TIEMPO REAL.
 * - Carga instantáneamente todos los estudiantes existentes sin límites artificiales (eliminado el bloqueo de 10.000).
 * - Permite filtrar por sede (para administradores y coordinadores) o ver su sede local asignada.
 * - Permite buscar por Nombre, Carrera, RUT o ID en tiempo real sin recargar.
 * - Incluye paginación ágil de 10 por pantalla para una navegación fluida.
 * - Detecta el estado de conexión (offline/online).
 */

// Opciones de sede para el selector de admins (con opción "Todas las Sedes")
const BRANCH_OPTIONS = [
  { label: 'Todas las Sedes', options: ['Todas las Sedes'] },
  ...CANONICAL_BRANCH_OPTIONS
];

// Cuántos estudiantes mostrar por pantalla en la paginación local
const ITEMS_PER_PAGE = 10;

const Directory = () => {
  // -------------------------------------------------------------------------
  // ESTADOS LOCALES
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailablePins, setShowOnlyAvailablePins] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState(null);

  // Sede seleccionada para filtrar (solo admins y coordinadores pueden cambiarla)
  const [selectedBranch, setSelectedBranch] = useState('Todas las Sedes');

  // Estado de conexión a Internet
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // -------------------------------------------------------------------------
  // CONTEXTO Y AUTENTICACIÓN (Sincronización en Tiempo Real vía DataContext)
  // -------------------------------------------------------------------------
  const { user } = useAuth();
  const { studentsList, updateStudent } = useData();

  const isGlobal = isGlobalUser(user);
  const canEdit = canManageStudents(user);

  // Sede efectiva para el filtrado
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
  // RESET DE PÁGINA AL CAMBIAR FILTROS O BÚSQUEDA
  // -------------------------------------------------------------------------
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showOnlyAvailablePins, selectedBranch]);

  // -------------------------------------------------------------------------
  // FILTRADO EN TIEMPO REAL SOBRE TODOS LOS ESTUDIANTES EXISTENTES
  // -------------------------------------------------------------------------
  const baseStudents = useMemo(() => {
    if (!effectiveBranch || effectiveBranch === 'Todas las Sedes') {
      return studentsList;
    }
    return studentsList.filter(s => s.branch === effectiveBranch);
  }, [studentsList, effectiveBranch]);

  const filteredStudents = useMemo(() => {
    return baseStudents.filter(student => {
      // Filtro 1: solo alumnos con pines disponibles sin recolectar
      if (showOnlyAvailablePins) {
        const pendientes = (student.availablePins || []).filter(
          pinId => !(student.collectedPins || []).includes(pinId)
        );
        if (pendientes.length === 0) return false;
      }

      // Filtro 2: búsqueda por texto (Nombre, Carrera, RUT o ID)
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (student.name && student.name.toLowerCase().includes(term)) ||
        (student.grade && student.grade.toLowerCase().includes(term)) ||
        (student.rut && student.rut.toLowerCase().includes(term)) ||
        (student.id && student.id.toLowerCase().includes(term))
      );
    });
  }, [baseStudents, showOnlyAvailablePins, searchTerm]);

  // -------------------------------------------------------------------------
  // PAGINACIÓN LOCAL (10 por pantalla)
  // -------------------------------------------------------------------------
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getVisiblePages = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const renderPaginationControls = () => (
    <div className="pagination-controls">
      <button
        className="page-btn nav-btn"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      >
        <ChevronLeft size={18} /> Anterior
      </button>

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
  // REGISTRAR ENTREGA DE CREDENCIAL EN TIEMPO REAL (Lanyard / Pasaporte)
  // -------------------------------------------------------------------------
  const handleDeliverCredential = async (studentId, credentialId) => {
    const target = studentsList.find(s => s.id === studentId);
    if (!target) return;

    const credentials = buildCredentialsMap(
      target,
      credentialId,
      user?.email || user?.name
    );

    // Al guardar en Firestore, el listener onSnapshot actualiza studentsList de inmediato
    await updateStudent(studentId, { credentials });
  };

  // -------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // -------------------------------------------------------------------------
  return (
    <div className="directory-page container">

      {/* ===== CABECERA ===== */}
      <div className="directory-header">
        <h1 className="page-title">Directorio de Estudiantes</h1>
        <p className="page-subtitle">Conoce a nuestros estudiantes y sigue su viaje.</p>

        {/* Indicador de modo Offline */}
        {!isOnline && (
          <div className="offline-banner">
            <WifiOff size={16} />
            <span>Modo sin conexión — viendo datos en caché local</span>
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

          {/* Selector de sede — sólo visible para admin y coordinador */}
          {isGlobal && (
            <div className="branch-filter-wrap">
              <Filter size={16} className="branch-filter-icon" />
              <CustomSelect
                value={selectedBranch}
                onChange={val => setSelectedBranch(val)}
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

      {/* ===== RESUMEN DE CARGA EN TIEMPO REAL ===== */}
      <div className="directory-summary">
        <span className="summary-count">
          {filteredStudents.length > 0
            ? `Mostrando ${Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)} de ${filteredStudents.length} resultado(s) — ${baseStudents.length} estudiante(s) en total`
            : studentsList.length === 0
              ? 'Conectando y cargando estudiantes en tiempo real...'
              : 'No hay resultados'}
        </span>
      </div>

      {/* ===== PAGINACIÓN SUPERIOR ===== */}
      {filteredStudents.length > 0 && renderPaginationControls()}

      {/* ===== GRILLA / LISTA DE TARJETAS DE ESTUDIANTE ===== */}
      <div className={viewMode === 'grid' ? 'students-grid' : 'students-list'}>
        {currentStudents.length > 0 ? (
          currentStudents.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={canEdit ? setEditingStudent : undefined}
              onDeliverCredential={canEdit ? handleDeliverCredential : undefined}
            />
          ))
        ) : (
          <div className="no-results">
            <p>
              {searchTerm
                ? `No se encontraron estudiantes que coincidan con "${searchTerm}".`
                : 'No hay estudiantes registrados en esta sede todavía.'}
            </p>
          </div>
        )}
      </div>

      {/* ===== PAGINACIÓN INFERIOR ===== */}
      {filteredStudents.length > 0 && renderPaginationControls()}

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
