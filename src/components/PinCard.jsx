import React from 'react';
import * as Icons from 'lucide-react';
import './PinCard.css';

const PinCard = ({ pin, isCollected, isAvailable, onClick }) => {
  const IconComponent = Icons[pin.icon] || Icons.HelpCircle;
  const isClickable = !isCollected && isAvailable;

  return (
    <div className={`pin-card ${isCollected ? 'collected' : (isAvailable ? 'available' : 'locked')}`} onClick={isClickable ? onClick : undefined} style={{ cursor: isClickable ? 'pointer' : 'default' }}>
      <div className="pin-icon-wrapper" style={pin.customImage ? { 
        padding: 0, 
        width: '56px', 
        height: '56px', 
        overflow: 'hidden', 
        background: 'white',
        border: '1px solid var(--border-color)' 
      } : {}}>
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
      <div className="pin-content">
        <h4 className="pin-name">{pin.name}</h4>
        <span className="pin-category">{pin.category}</span>
        <p className="pin-description">{pin.description}</p>
      </div>
      {!isCollected && (
        <div className="pin-overlay">
          {isAvailable ? (
            <Icons.Unlock size={28} className="unlock-icon" />
          ) : (
            <Icons.Lock size={24} className="lock-icon" />
          )}
        </div>
      )}
    </div>
  );
};

export default PinCard;
