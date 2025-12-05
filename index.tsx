
import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>Si è verificato un errore.</h1>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>L'applicazione ha riscontrato un problema imprevisto. Prova a ricaricare la pagina.</p>
          
          <pre style={{ background: '#e2e8f0', padding: '15px', borderRadius: '8px', overflow: 'auto', textAlign: 'left', maxWidth: '800px', width: '90%', maxHeight: '300px', fontSize: '14px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
            {this.state.error?.toString()}
          </pre>
          
          <button 
            onClick={() => window.location.reload()}
            style={{ 
                padding: '12px 24px', 
                backgroundColor: '#0ea5e9', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            Ricarica Pagina
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
