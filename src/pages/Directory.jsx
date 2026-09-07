import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StudentCard from '../components/StudentCard';
import { Search, Grid, List, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import './Directory.css';

const Directory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailablePins, setShowOnlyAvailablePins] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { studentsList } = useData();

  const isGlobal = user.role === 'admin';
  const relevantStudents = isGlobal 
    ? studentsList 
    : studentsList.filter(s => s.branch === user.branch);

  const filteredStudents = relevantStudents.filter(student => {
    if (showOnlyAvailablePins) {
      const uncollectedAvailable = (student.availablePins || []).filter(
        pinId => !(student.collectedPins || []).includes(pinId)
      );
      if (uncollectedAvailable.length === 0) return false;
    }
    
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.rut && student.rut.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination logic
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // When search changes, reset page
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getVisiblePages = () => {
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const PaginationControls = () => (
    <div className="pagination-controls">
      <button 
        className="page-btn nav-btn" 
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
      >
        <ChevronLeft size={20} /> Anterior
      </button>

      <div className="page-numbers">
        {getVisiblePages().map(pageNum => (
          <button
            key={pageNum}
            className={`page-btn number-btn ${currentPage === pageNum ? 'active' : ''}`}
            onClick={() => setCurrentPage(pageNum)}
          >
            {pageNum}
          </button>
        ))}
      </div>

      <button 
        className="page-btn nav-btn" 
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
      >
        Siguiente <ChevronRight size={20} />
      </button>
    </div>
  );

  return (
    <div className="directory-page container">
      <div className="directory-header">
        <h1 className="page-title">Directorio de Estudiantes</h1>
        <p className="page-subtitle">Conoce a nuestros estudiantes y sigue su viaje.</p>

        <div className="directory-actions">
          <div className="search-bar glass-panel">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o grado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="view-toggles">
            <button 
              className={`view-btn ${showOnlyAvailablePins ? 'active' : ''}`}
              onClick={() => setShowOnlyAvailablePins(!showOnlyAvailablePins)}
              title="Filtrar estudiantes con pines disponibles"
              style={showOnlyAvailablePins ? { color: 'var(--color-primary)' } : {}}
            >
              <Award size={20} />
            </button>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.25rem' }}></div>

            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista Cuadrícula"
            >
              <Grid size={20} />
            </button>
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

      {filteredStudents.length > 0 && <PaginationControls />}

      <div className={viewMode === 'grid' ? 'students-grid' : 'students-list'}>
        {currentStudents.length > 0 ? (
          currentStudents.map(student => (
            <StudentCard key={student.id} student={student} />
          ))
        ) : (
          <div className="no-results">
            <p>No se encontraron estudiantes que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>

      {filteredStudents.length > 0 && <PaginationControls />}
    </div>
  );
};

export default Directory;
