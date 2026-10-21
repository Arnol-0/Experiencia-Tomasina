import React, { useEffect, useState } from 'react';
import { Check, IdCard, BookUser } from 'lucide-react';
import './CredentialButton.css';

/**
 * ============================================================================
 * COMPONENTE: CredentialButton (Botón Circular de Entrega de Credencial)
 * ============================================================================
 *
 * 📌 ¿QUÉ HACE ESTE COMPONENTE?
 * Botón circular que representa la entrega de una credencial física
 * (lanyard o pasaporte) a un estudiante.
 *
 * - Estado PENDIENTE: muestra el ícono de la credencial (IdCard / BookUser).
 * - Al hacer clic: el botón hace una animación de "pop" con un anillo verde
 *   expansivo y el ícono de la credencial se transforma en un check que se
 *   "dibuja" trazo a trazo.
 * - Estado ENTREGADO (persistido en Firestore): queda en verde con el check
 *   fijo, de modo que en las próximas visitas se ve que ya lo recibió.
 *
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. SRP (Responsabilidad Única):
 *    Este componente sólo dibuja el botón y gestiona su animación. No sabe
 *    cómo se guardan los datos (eso lo resuelve quien lo usa) ni consulta
 *    Firebase.
 * 2. ISP (Segregación de Interfaces):
 *    Recibe exactamente lo que necesita: `credential`, `delivered`, `onDeliver`
 *    y `canDeliver`. Si no se le pasa `onDeliver`, el botón queda inactivo.
 * 3. OCP (Abierto/Cerrado):
 *    Para agregar una credencial nueva basta con sumar una entrada en
 *    `constants/credentials.js` con su ícono; no hay que tocar este archivo.
 */

/** Mapa de íconos disponibles para el catálogo de credenciales */
const CREDENTIAL_ICONS = {
  IdCard,
  BookUser
};

const CredentialButton = ({
  credential,
  delivered = false,
  deliveredAt = null,
  onDeliver,
  canDeliver = true,
  showLabel = true,
  size = 'md'
}) => {
  // Estado transitorio de la animación (pop + check) al momento del clic
  const [isAnimating, setIsAnimating] = useState(false);

  // Estado transitorio que dibuja el trazo del check
  const [isDrawing, setIsDrawing] = useState(false);

  /**
   * 📌 Estado optimista: se activa al hacer clic para que el check aparezca
   * de inmediato (sin esperar el viaje de ida y vuelta a Firestore).
   * Si el guardado falla, se revierte y vuelve al estado pendiente.
   */
  const [isLatched, setIsLatched] = useState(false);

  const Icon = CREDENTIAL_ICONS[credential?.icon] || IdCard;

  /**
   * Formatea la fecha de entrega para mostrarla bajo el estado.
   */
  const formatDeliveredAt = (isoDate) => {
    if (!isoDate) return null;
    try {
      return new Date(isoDate).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  // El check se muestra si ya fue entregado, si acaba de marcarse o si la
  // entrega quedó confirmada en Firestore (prop `delivered`).
  const showCheck = delivered || isLatched;
  const isInteractive = canDeliver && !showCheck && typeof onDeliver === 'function';

  /**
   * Registra la entrega de la credencial.
   * 📌 Si el guardado falla (permisos, sin internet), se revierte la animación
   * para no mostrar un check que no está persistido en la base de datos.
   */
  const handleClick = async () => {
    if (!isInteractive) return;

    setIsLatched(true);
    setIsAnimating(true);
    setIsDrawing(true);

    try {
      await onDeliver(credential.id);
    } catch (error) {
      setIsLatched(false);
      setIsAnimating(false);
      setIsDrawing(false);
      throw error;
    }
  };

  // El trazo del check se dibuja en ~700ms
  useEffect(() => {
    if (!isDrawing) return;
    const timer = setTimeout(() => setIsDrawing(false), 700);
    return () => clearTimeout(timer);
  }, [isDrawing]);

  // La animación de "pop" dura ~550ms: al terminar, el estado permanente
  // (verde con check fijo) queda a cargo del componente.
  useEffect(() => {
    if (!isAnimating) return;
    const timer = setTimeout(() => setIsAnimating(false), 650);
    return () => clearTimeout(timer);
  }, [isAnimating]);

  return (
    <div className={`credential-item credential-size-${size}`}>
      <button
        type="button"
        className={[
          'credential-btn',
          showCheck ? 'is-delivered' : '',
          isAnimating ? 'is-animating' : ''
        ].filter(Boolean).join(' ')}
        onClick={handleClick}
        disabled={!isInteractive}
        aria-pressed={Boolean(showCheck)}
        aria-label={`${delivered ? 'Entregado' : 'Registrar entrega de'} ${credential?.label || 'credencial'}`}
        title={
          isInteractive
            ? `Registrar entrega de ${credential?.label}`
            : delivered
              ? `${credential?.label} entregado`
              : `Sin permisos para registrar la entrega de ${credential?.label}`
        }
      >
        {/* Contenedor apilado: el ícono y el check comparten la misma celda */}
        <span className="credential-icon-wrap">
          <Icon className="credential-icon" size={size === 'sm' ? 16 : 26} strokeWidth={2} />
          <Check
            className={`credential-check ${isDrawing ? 'is-drawing' : ''}`}
            size={size === 'sm' ? 16 : 26}
            strokeWidth={3}
          />
        </span>
      </button>

      {/* Etiqueta y estado (sólo en la vista de perfil) */}
      {showLabel && (
        <>
          <span className="credential-label">{credential?.label}</span>
          <span className={`credential-status ${delivered ? 'is-done' : ''}`}>
            {delivered ? 'Entregado' : 'Pendiente'}
          </span>
          {delivered && deliveredAt && (
            <span className="credential-date">{formatDeliveredAt(deliveredAt)}</span>
          )}
        </>
      )}
    </div>
  );
};

export default CredentialButton;
