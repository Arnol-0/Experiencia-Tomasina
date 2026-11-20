import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import CustomSelect from '../components/CustomSelect';
import { Trophy, Award, Filter, Medal, Sparkles, MapPin, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { isGlobalUser } from '../utils/permissions';
import { branchOptions as CANONICAL_BRANCH_OPTIONS } from '../constants/branches';
import { PINS_CATALOG } from '../constants/pinsCatalog';
import './Ranking.css';

const ITEMS_PER_PAGE = 10;
const TOTAL_PINS = PINS_CATALOG.length;

const BRANCH_OPTIONS = [
  { label: 'Todas las Sedes', options: ['Todas las Sedes'] },
  ...CANONICAL_BRANCH_OPTIONS
];

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const Ranking = () => {
  const { user } = useAuth();
  const { studentsList } = useData();
  const isGlobal = isGlobalUser(user);
  const [selectedBranch, setSelectedBranch] = useState('Todas las Sedes');
  const [currentPage, setCurrentPage] = useState(1);

  const effectiveBranch = isGlobal ? selectedBranch : (user?.branch || 'Todas las Sedes');
  const isNationalView = !effectiveBranch || effectiveBranch === 'Todas las Sedes';

  const rankedStudents = useMemo(() => {
    let base = studentsList || [];
    if (!isNationalView) {
      base = base.filter((s) => s.branch === effectiveBranch);
    }

    return base
      .map((s) => ({
        ...s,
        pinsCount: (s.collectedPins || []).length
      }))
      .sort((a, b) => {
        if (b.pinsCount !== a.pinsCount) return b.pinsCount - a.pinsCount;
        return String(a.name || '').localeCompare(String(b.name || ''), 'es');
      });
  }, [studentsList, effectiveBranch, isNationalView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveBranch, isNationalView]);

  const totalPins = rankedStudents.reduce((acc, s) => acc + s.pinsCount, 0);
  const topThree = rankedStudents.slice(0, 3);

  const totalPages = Math.ceil(rankedStudents.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentRankedStudents = rankedStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getVisiblePages = () => {
    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const getRankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  };

  const getRankLabel = (index) => {
    if (index === 0) return '1er lugar';
    if (index === 1) return '2do lugar';
    if (index === 2) return '3er lugar';
    return `#${index + 1}`;
  };

  const renderPaginationControls = (position = 'top') => {
    const from = rankedStudents.length === 0 ? 0 : startIndex + 1;
    const to = Math.min(startIndex + ITEMS_PER_PAGE, rankedStudents.length);

    return (
      <div className={`ranking-pagination-controls ${position}`}>
        <span className="ranking-pagination-info">
          Mostrando <strong>{from}-{to}</strong> de <strong>{rankedStudents.length}</strong>
        </span>

        <div className="ranking-pagination-actions">
          <button
            className="ranking-page-btn nav-btn"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>

          <div className="ranking-page-numbers">
            {getVisiblePages().map((num) => (
              <button
                key={num}
                className={`ranking-page-btn number-btn ${safeCurrentPage === num ? 'active' : ''}`}
                onClick={() => setCurrentPage(num)}
                aria-label={`Ir a página ${num}`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            className="ranking-page-btn nav-btn"
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Página siguiente"
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="ranking-page container">
      <section className="ranking-hero">
        <div className="ranking-hero-bg-wrap" aria-hidden="true">
          <div className="ranking-hero-bg" />
        </div>
        <div className="ranking-header">
          <div className="ranking-title-wrap">
            <span className="ranking-kicker"><Sparkles size={14} /> Tabla de líderes</span>
            <h1 className="page-title">Ranking de Estudiantes</h1>
            <p className="page-subtitle">
              Estudiantes con más pines obtenidos {isNationalView ? 'a nivel nacional' : `en ${effectiveBranch}`}.
            </p>
          </div>

          <div className="ranking-actions">
            {isGlobal && (
              <div className="branch-filter-wrap glass-panel">
                <Filter size={16} className="branch-filter-icon" />
                <CustomSelect
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  options={BRANCH_OPTIONS}
                  placeholder="Filtrar por sede..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="ranking-stats">
          <div className="ranking-stat glass-panel">
            <div className="stat-icon trophy"><Trophy size={22} /></div>
            <div className="stat-text">
              <span className="stat-label">Estudiantes en ranking</span>
              <strong>{rankedStudents.length}</strong>
            </div>
          </div>
          <div className="ranking-stat glass-panel">
            <div className="stat-icon award"><Award size={22} /></div>
            <div className="stat-text">
              <span className="stat-label">Pines totales</span>
              <strong>{totalPins}</strong>
            </div>
          </div>
          <div className="ranking-stat glass-panel">
            <div className="stat-icon medal"><Medal size={22} /></div>
            <div className="stat-text">
              <span className="stat-label">Líder actual</span>
              <strong>{rankedStudents[0]?.name || '—'}</strong>
            </div>
          </div>
        </div>
      </section>

      {topThree.length > 0 && (
        <section className="top-three-grid">
          {topThree.map((student, idx) => (
            <article key={student.id} className={`top-card glass-panel ${getRankClass(idx)}`}>
              <div className="top-card-glow" aria-hidden="true" />
              <div className="top-card-header">
                <span className="top-badge">
                  {idx === 0 ? <Crown size={16} /> : <Medal size={16} />}
                  {getRankLabel(idx)}
                </span>
                <span className="top-position">#{idx + 1}</span>
              </div>

              <div className="top-profile">
                <div className={`top-avatar ${getRankClass(idx)}`}>
                  {getInitials(student.name)}
                </div>
                <div className="top-info">
                  <h3>{student.name || 'Sin nombre'}</h3>
                  <p className="top-grade">{student.grade || 'Sin carrera'}</p>
                  <p className="top-meta">
                    <MapPin size={13} />
                    <span>{student.branch || 'Sin sede'}</span>
                  </p>
                </div>
              </div>

              <div className="top-pins">
                <div className="top-pins-label">
                  <Award size={16} />
                  <span>Pines obtenidos</span>
                </div>
                <strong>{student.pinsCount}</strong>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="ranking-list glass-panel">
        <div className="ranking-list-header">
          <h2>Clasificación completa</h2>
          <span>{rankedStudents.length} estudiante{rankedStudents.length === 1 ? '' : 's'}</span>
        </div>

        {rankedStudents.length === 0 ? (
          <div className="ranking-empty">No hay estudiantes para mostrar en este ranking.</div>
        ) : (
          <>
            {renderPaginationControls('top')}
            <div className="ranking-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estudiante</th>
                    <th>Carrera</th>
                    {isNationalView && <th>Sede</th>}
                    <th>Progreso</th>
                    <th>Pines</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRankedStudents.map((student, pageIdx) => {
                    const idx = startIndex + pageIdx;
                    const progress = TOTAL_PINS > 0 ? Math.min(100, Math.round((student.pinsCount / TOTAL_PINS) * 100)) : 0;
                    return (
                      <tr key={student.id} className={idx < 3 ? `highlight-row ${getRankClass(idx)}` : ''}>
                        <td>
                          <span className={`rank-pill ${getRankClass(idx)}`}>{idx + 1}</span>
                        </td>
                        <td>
                          <div className="student-cell">
                            <div className={`student-avatar ${getRankClass(idx)}`}>{getInitials(student.name)}</div>
                            <div className="student-text">
                              <span className="student-name">{student.name || 'Sin nombre'}</span>
                              <span className="student-rut">{student.rut || student.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="muted-cell">{student.grade || 'Sin carrera'}</td>
                        {isNationalView && <td className="muted-cell">{student.branch || 'Sin sede'}</td>}
                        <td>
                          <div className="progress-wrap">
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${getRankClass(idx)}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="progress-value">{student.pinsCount}/{TOTAL_PINS}</span>
                          </div>
                        </td>
                        <td>
                          <span className="pins-chip">
                            <Award size={15} />
                            <strong>{student.pinsCount}</strong>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPaginationControls('bottom')}
          </>
        )}
      </section>
    </div>
  );
};

export default Ranking;
