import React from 'react';
import * as Icons from 'lucide-react';
import './PinCard.css';

/**
 * ============================================================================
 * COMPONENTE: PinCard (Tarjeta Visual de Pin / Insignia)
 * ============================================================================
 * 
 * 📌 ¿QUÉ HACE ESTE COMPONENTE?
 * Renderiza la ficha gráfica de cada insignia formativa (Semana 0, Voluntariado,
 * Liderazgo, etc.). Refleja automáticamente los 3 posibles estados del pin:
 * 1. Obtenido: Desbloqueado y con color dorado de éxito.
 * 2. Disponible: Requisitos cumplidos, esperando clic para ser desbloqueado (candado abierto).
 * 3. Bloqueado: Aún no cumple requisitos (candado cerrado y gris).
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. ISP (Interface Segregation Principle - Segregación de Interfaces):
 *    Este componente solo solicita en sus props lo estrictamente necesario:
 *    `{ pin, isCollected, isAvailable, onClick }`. No se le obliga a recibir
 *    todo el objeto del estudiante ni métodos irrelevantes para su función.
 * 
 * 2. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Su única responsabilidad es renderizar visualmente el estado del pin.
 */
const PinCard = ({ pin, isCollected, isAvailable, onClick }) => {
  // 1. Selector dinámico del icono: Busca el icono en 'lucide-react' o usa un signo de pregunta por defecto
  const IconComponent = Icons[pin.icon] || Icons.HelpCircle;

  // 2. Determina si se puede hacer clic: Solo si está disponible y aún no se ha obtenido
  const isClickable = !isCollected && isAvailable;

  return (
    <div 
      // Clase CSS dinámica según el estado: 'collected', 'available' o 'locked'
      className={`pin-card ${isCollected ? 'collected' : (isAvailable ? 'available' : 'locked')}`} 
      // Si es clickeable asignamos la función onClick; si no, queda desactivado (undefined)
      onClick={isClickable ? onClick : undefined} 
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
      {/* CONTENEDOR DE LA IMAGEN O ICONO DEL PIN */}
      <div 
        className="pin-icon-wrapper" 
        style={pin.customImage ? { 
          padding: 0, 
          width: '56px', 
          height: '56px', 
          overflow: 'hidden', 
          background: 'white',
          border: '1px solid var(--border-color)' 
        } : {}}
      >
        {/* Si el pin tiene una imagen real (como fotos institucionales), la muestra; si no, muestra el icono vectorial */}
        {pin.customImage ? (
          <img 
            src={pin.customImage} 
            alt={pin.name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain'
            }} 
          />
        ) : (
          <IconComponent className="pin-icon" size={32} />
        )}
      </div>

      {/* CONTENIDO TEXTUAL: Nombre, Categoría y Descripción */}
      <div className="pin-content">
        <h4 className="pin-name">{pin.name}</h4>
        <span className="pin-category">{pin.category}</span>
        <p className="pin-description">{pin.description}</p>
      </div>

      {/* OVERLAY DEL CANDADO: Solo se muestra si el pin aún NO ha sido obtenido */}
      {!isCollected && (
        <div className="pin-overlay">
          {/* Si está disponible muestra el candado abierto; si no, el candado cerrado */}
          {isAvailable ? (
            <Icons.Unlock size={28} className="unlock-icon" title="¡Listo para desbloquear!" />
          ) : (
            <Icons.Lock size={24} className="lock-icon" title="Bloqueado" />
          )}
        </div>
      )}
    </div>
  );
};

export default PinCard;

