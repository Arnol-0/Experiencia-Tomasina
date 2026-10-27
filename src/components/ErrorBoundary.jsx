import React from 'react';

/**
 * ============================================================================
 * COMPONENTE: ErrorBoundary (Límite de Errores para Resiliencia)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. OCP (Open/Closed Principle - Abierto para Extensión / Cerrado para Modificación):
 *    Actúa como un envoltorio defensivo alrededor de <App /> o cualquier vista.
 *    Protege la aplicación de fallos inesperados sin necesidad de modificar el
 *    código interno de los componentes hijos.
 * 
 * 2. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Su única misión es capturar errores de renderizado de React en tiempo de ejecución,
 *    evitar que la pantalla se quede en blanco (White Screen of Death) y mostrar
 *    un mensaje amigable con opción de recargar.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // Se activa cuando un componente hijo lanza una excepción
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Registra el error para depuración
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }


  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#f8d7da', color: '#721c24', margin: '2rem', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
          <h2>Algo salió mal (Crash de React)</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            <summary>Ver detalles del error</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
            onClick={() => window.location.reload()}
          >
            Recargar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
