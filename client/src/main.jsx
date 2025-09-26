import React from "react";
import { createRoot } from 'react-dom/client';
import App from "./App.jsx";
import "./global.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Global error handler
window.addEventListener('error', (event) => {
  const error = event.error || event;
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
  
  // Prevent the default error handler
  event.preventDefault();
  return true;
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});