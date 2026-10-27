import React, { useState, useRef } from 'react';
import BaseModal from './BaseModal';
import { 
  Zap, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Award, 
  IdCard, 
  BookUser, 
  Users, 
  Building,
  RotateCcw
} from 'lucide-react';
import { TEMPLATES } from '../../constants/templates';
import './AutomaticFillModal.css';

/**
 * ============================================================================
 * COMPONENTE: AutomaticFillModal (Llenado Automático de Pines y Credenciales)
 * ============================================================================
 * 
 * 📌 RESPONSABILIDAD:
 * Permite subir un archivo Excel con estudiantes de una o múltiples sedes,
 * aplicando en tiempo real los pines ganados/obtenidos y la entrega de credenciales
 * (Lanyard y Pasaporte) sin necesidad de registros manuales individuales.
 */
const AutomaticFillModal = ({ 
  isOpen, 
  onClose, 
  onProcessAutoFill,
  user
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Opciones configurables por el usuario
  const [markAsCollected, setMarkAsCollected] = useState(true);
  const [deliverLanyard, setDeliverLanyard] = useState(true);
  const [deliverPassport, setDeliverPassport] = useState(true);
  const [autoCreateStudents, setAutoCreateStudents] = useState(true);

  const fileInputRef = useRef(null);
  const templatePin = TEMPLATES.find(t => t.id === 'pins');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg('');
      setResult(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMsg('');
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Por favor selecciona un archivo Excel (.xlsx, .xls o .csv)');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    setResult(null);

    try {
      const options = {
        markAsCollected,
        deliverLanyardOption: deliverLanyard,
        deliverPassportOption: deliverPassport,
        autoCreateStudents,
        operatorEmail: user?.email || user?.name || 'Llenado Automático'
      };

      const planResult = await onProcessAutoFill(selectedFile, options, (prog) => {
        setProgress(prog);
      });

      setResult(planResult);
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el llenado automático.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={() => { if (!isProcessing) onClose(); }} 
      title="Llenado Automático de Pines y Credenciales" 
      icon={Zap} 
      maxWidth="620px"
    >
      <div className="autofill-modal-body">
        
        {!result && (
          <>
            <p className="autofill-intro">
              Actualiza masivamente y en <strong>tiempo real</strong> los pines ganados, 
              <strong> Lanyard</strong> y <strong>Pasaporte</strong> para estudiantes de 
              <strong> una o múltiples sedes</strong>, sin registros manuales uno por uno.
            </p>

            {/* Zona de Selección o Drag & Drop */}
            <div 
              className={`autofill-dropzone ${selectedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              
              <UploadCloud size={36} className="autofill-dropzone-icon" />
              
              {selectedFile ? (
                <div className="autofill-file-info">
                  <FileSpreadsheet size={20} color="var(--color-primary)" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <>
                  <span className="autofill-dropzone-title">Haz clic o arrastra aquí tu base de pines (Excel)</span>
                  <span className="autofill-dropzone-subtitle">Archivos compatibles: .xlsx, .xls, .csv (hasta 15 MB)</span>
                </>
              )}
            </div>

            {/* Enlace de descarga de plantilla */}
            {templatePin && (
              <div style={{ textAlign: 'center' }}>
                <a 
                  href={templatePin.url} 
                  download={templatePin.fileName}
                  className="modal-template-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={15} /> ¿No tienes la plantilla? Descargar Plantilla Oficial (Pines, Lanyard y Pasaporte)
                </a>
              </div>
            )}

            {/* Opciones de procesamiento */}
            <div className="autofill-options-card">
              <span className="autofill-options-title">Configuración del Llenado</span>
              
              <label className="autofill-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={markAsCollected} 
                  onChange={(e) => setMarkAsCollected(e.target.checked)} 
                />
                <span>Completar pines directamente (marcar como obtenidos y desbloqueados)</span>
              </label>

              <label className="autofill-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={deliverLanyard} 
                  onChange={(e) => setDeliverLanyard(e.target.checked)} 
                />
                <span>Registrar entrega de <strong>Lanyard</strong> (detectar en Excel o marcar entregado)</span>
              </label>

              <label className="autofill-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={deliverPassport} 
                  onChange={(e) => setDeliverPassport(e.target.checked)} 
                />
                <span>Registrar entrega de <strong>Pasaporte</strong> (detectar en Excel o marcar entregado)</span>
              </label>

              <label className="autofill-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={autoCreateStudents} 
                  onChange={(e) => setAutoCreateStudents(e.target.checked)} 
                />
                <span>Crear automáticamente al estudiante si no existe (con su sede correspondiente)</span>
              </label>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {isProcessing ? (
              <div className="autofill-progress-container">
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                  Actualizando en tiempo real ({progress.current} de {progress.total} estudiantes)...
                </span>
                <div className="autofill-progress-bar-bg">
                  <div 
                    className="autofill-progress-bar-fill" 
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 15}%` }}
                  />
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={!selectedFile}
                className="autofill-btn-primary"
              >
                <Zap size={18} /> Iniciar Llenado Automático
              </button>
            )}
          </>
        )}

        {/* Vista de Resumen de Resultados al terminar */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#ecfdf5', borderRadius: '0.75rem', border: '1px solid #a7f3d0' }}>
              <CheckCircle2 size={32} color="#059669" />
              <div>
                <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.05rem' }}>¡Llenado Automático Exitoso!</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#047857' }}>
                  Los datos se actualizaron en tiempo real en la base de datos de Firestore.
                </p>
              </div>
            </div>

            {/* Tarjetas de métricas */}
            <div className="autofill-metrics-grid">
              <div className="autofill-metric-card">
                <Users size={20} color="var(--color-primary)" style={{ margin: '0 auto' }} />
                <div className="autofill-metric-value">{result.updates.length}</div>
                <div className="autofill-metric-label">Alumnos Procesados</div>
              </div>

              <div className="autofill-metric-card">
                <Award size={20} color="#f59e0b" style={{ margin: '0 auto' }} />
                <div className="autofill-metric-value">{result.totalPinsAdded}</div>
                <div className="autofill-metric-label">Pines Actualizados</div>
              </div>

              <div className="autofill-metric-card">
                <IdCard size={20} color="#3b82f6" style={{ margin: '0 auto' }} />
                <div className="autofill-metric-value">{result.totalLanyardsDelivered}</div>
                <div className="autofill-metric-label">Lanyards Entregados</div>
              </div>

              <div className="autofill-metric-card">
                <BookUser size={20} color="#8b5cf6" style={{ margin: '0 auto' }} />
                <div className="autofill-metric-value">{result.totalPassportsDelivered}</div>
                <div className="autofill-metric-label">Pasaportes Entregados</div>
              </div>
            </div>

            {/* Desglose por Sedes */}
            {Object.keys(result.sedesBreakdown || {}).length > 0 && (
              <div className="autofill-sedes-breakdown">
                <div className="autofill-sedes-title">
                  <Building size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Impacto por Sede ({Object.keys(result.sedesBreakdown).length} sedes actualizadas):
                </div>
                <div className="autofill-sedes-chips">
                  {Object.entries(result.sedesBreakdown).map(([sede, count]) => (
                    <span key={sede} className="autofill-sede-chip">
                      <strong>{sede}:</strong> {count} alumnos
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Avisos o pendientes si hubiesen */}
            {(result.rowsWithoutStudent > 0 || result.unknownPins.length > 0) && (
              <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#92400e' }}>
                {result.rowsWithoutStudent > 0 && (
                  <div>• {result.rowsWithoutStudent} filas omitidas (estudiantes no encontrados y sin datos para creación).</div>
                )}
                {result.unknownPins.length > 0 && (
                  <div>• Nombres de pines no identificados: {[...new Set(result.unknownPins)].slice(0, 4).join(', ')}.</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={handleReset} 
                className="btn-outline btn-outline-green" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <RotateCcw size={16} /> Cargar Otro Archivo
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="autofill-btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cerrar y Ver Tablero
              </button>
            </div>
          </div>
        )}

      </div>
    </BaseModal>
  );
};

export default AutomaticFillModal;
