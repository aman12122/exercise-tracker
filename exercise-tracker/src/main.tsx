import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

console.log('[main.tsx] Starting application...');

// Dynamically import App to catch any module-level errors
async function init() {
  try {
    console.log('[main.tsx] Importing App component...');
    const { default: App } = await import('./App.tsx');
    console.log('[main.tsx] App imported successfully, rendering...');

    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found!');
    }

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('[main.tsx] Render called successfully');
  } catch (error) {
    console.error('[main.tsx] Fatal error during initialization:', error);
    // Show error on screen
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; background: #1a1a1a; color: #fff; min-height: 100vh;">
          <h1 style="color: #ef4444;">Application Error</h1>
          <pre style="background: #2a2a2a; padding: 16px; border-radius: 8px; overflow: auto; color: #f87171;">${error instanceof Error ? error.stack || error.message : String(error)}</pre>
        </div>
      `;
    }
  }
}

init();
