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

window.addEventListener('error', (event) => {
  const error = event.error || event;
  
  event.preventDefault();
  return true;
});

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
});