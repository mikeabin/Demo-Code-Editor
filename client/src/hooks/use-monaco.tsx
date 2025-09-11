import { useState, useEffect } from "react";

declare global {
  interface Window {
    monaco: any;
  }
}

const useMonaco = () => {
  const [monaco, setMonaco] = useState<any>(null);

  useEffect(() => {
    // Load Monaco Editor
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
    script.async = true;
    
    script.onload = () => {
      const loader = (window as any).require;
      loader.config({ 
        paths: { 
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' 
        } 
      });
      
      loader(['vs/editor/editor.main'], () => {
        setMonaco(window.monaco);
      });
    };

    if (!document.querySelector('script[src*="monaco-editor"]')) {
      document.head.appendChild(script);
    } else if (window.monaco) {
      setMonaco(window.monaco);
    }
  }, []);

  return { monaco };
};

export { useMonaco };
