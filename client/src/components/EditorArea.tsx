import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";
import { useMonaco } from "@/hooks/use-monaco";
import { type FileTree, type FileNode } from "@shared/schema";

interface EditorAreaProps {
  files: FileTree;
  openTabs: string[];
  activeTab: string;
  onTabChange: (fileName: string) => void;
  onTabClose: (fileName: string) => void;
  onFileChange: (fileName: string, content: string) => void;
  projectId: string;
}

export default function EditorArea({
  files,
  openTabs,
  activeTab,
  onTabChange,
  onTabClose,
  onFileChange,
  projectId
}: EditorAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const modelCacheRef = useRef<Map<string, any>>(new Map());
  const activeTabRef = useRef<string>(activeTab);
  const filesRef = useRef<FileTree>(files);
  const isUpdatingModelRef = useRef<boolean>(false);
  const { monaco } = useMonaco();
  const queryClient = useQueryClient();

  // Utility function to get file by path
  const getFileByPath = useCallback((path: string, fileTree: FileTree): FileNode | null => {
    if (!path) return null;
    
    const pathParts = path.split('/');
    let current: any = fileTree;
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (current[part]) {
        if (current[part].type === 'file' && i === pathParts.length - 1) {
          return current[part];
        } else if (current[part].type === 'folder' && current[part].children) {
          current = current[part].children;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    
    return null;
  }, []);

  // Utility function to update file by path
  const updateFileByPath = useCallback((path: string, content: string, fileTree: FileTree): FileTree => {
    const pathParts = path.split('/');
    const newTree = { ...fileTree };
    let current: any = newTree;
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (i === pathParts.length - 1) {
        // Last part - update the file content
        if (current[part] && current[part].type === 'file') {
          current[part] = { ...current[part], content };
        }
      } else {
        // Navigate deeper
        if (current[part] && current[part].type === 'folder') {
          current[part] = { ...current[part], children: { ...current[part].children } };
          current = current[part].children;
        }
      }
    }
    
    return newTree;
  }, []);

  const updateFilesMutation = useMutation({
    mutationFn: async (updatedFiles: FileTree) => {
      const response = await apiRequest("PUT", `/api/projects/${projectId}/files`, updatedFiles);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  // Update activeTab ref whenever activeTab changes
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Update files ref whenever files change
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Load settings from localStorage
  const loadSettings = useCallback(() => {
    const savedSettings = localStorage.getItem('editor-settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Initialize Monaco Editor
  useEffect(() => {
    if (monaco && editorRef.current && !editorInstanceRef.current) {
      const settings = loadSettings();
      const monacoEditor = monaco.editor.create(editorRef.current, {
        value: "",
        language: "html",
        theme: settings?.theme === "light" ? "vs" : "vs-dark",
        automaticLayout: true,
        fontSize: settings?.fontSize || 14,
        fontFamily: "var(--font-mono)",
        minimap: { enabled: settings?.minimap || false },
        scrollBeyondLastLine: false,
        wordWrap: settings?.wordWrap !== false ? "on" : "off",
        lineNumbers: "on",
        renderWhitespace: "selection",
        tabSize: 2,
        insertSpaces: true,
      });

      editorInstanceRef.current = monacoEditor;

      // Listen for settings changes
      const handleSettingsChange = () => {
        const newSettings = loadSettings();
        if (newSettings && monacoEditor) {
          monacoEditor.updateOptions({
            fontSize: newSettings.fontSize || 14,
            minimap: { enabled: newSettings.minimap || false },
            wordWrap: newSettings.wordWrap !== false ? "on" : "off",
          });
          monaco.editor.setTheme(newSettings.theme === "light" ? "vs" : "vs-dark");
        }
      };

      window.addEventListener('editor-settings-changed', handleSettingsChange);

      // Save on Ctrl+S
      monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const currentContent = monacoEditor.getValue();
        if (activeTabRef.current && getFileByPath(activeTabRef.current, filesRef.current)) {
          const updatedFiles = updateFileByPath(activeTabRef.current, currentContent, filesRef.current);
          updateFilesMutation.mutate(updatedFiles);
        }
      });

      // Update file content on change
      monacoEditor.onDidChangeModelContent(() => {
        if (activeTabRef.current && !isUpdatingModelRef.current) {
          onFileChange(activeTabRef.current, monacoEditor.getValue());
        }
      });

      return () => {
        // Remove settings listener
        window.removeEventListener('editor-settings-changed', handleSettingsChange);
        
        // Dispose all cached models
        modelCacheRef.current.forEach((model) => {
          if (model && !model.isDisposed()) {
            model.dispose();
          }
        });
        modelCacheRef.current.clear();
        
        if (editorInstanceRef.current) {
          editorInstanceRef.current.dispose();
          editorInstanceRef.current = null;
        }
      };
    }
  }, [monaco, loadSettings]);

  // Update editor content when active tab changes
  useEffect(() => {
    if (editorInstanceRef.current && activeTab && monaco) {
      const editor = editorInstanceRef.current;
      const currentFile = getFileByPath(activeTab, files);
      
      if (!currentFile) return;
      
      const language = getLanguageFromFileName(activeTab);
      
      // Check if model already exists in cache
      let model = modelCacheRef.current.get(activeTab);
      
      if (!model || model.isDisposed()) {
        // Dispose any existing model that might have same URI
        const existingModel = monaco.editor.getModel(monaco.Uri.file(activeTab));
        if (existingModel && !existingModel.isDisposed()) {
          existingModel.dispose();
        }
        
        // Create new model with unique URI
        const uri = monaco.Uri.file(activeTab);
        model = monaco.editor.createModel(
          currentFile.content || "",
          language,
          uri
        );
        modelCacheRef.current.set(activeTab, model);
      } else {
        // Update existing model content if it changed
        const currentContent = model.getValue();
        if (currentContent !== (currentFile.content || "")) {
          isUpdatingModelRef.current = true;
          model.setValue(currentFile.content || "");
          isUpdatingModelRef.current = false;
        }
      }
      
      // Ensure editor is properly set with the model
      if (editor.getModel() !== model) {
        editor.setModel(model);
      }
      
      // Force editor to refresh layout
      setTimeout(() => {
        editor.layout();
      }, 10);
    }
  }, [activeTab, files, monaco, getFileByPath]);

  // Clean up models for closed tabs
  useEffect(() => {
    const currentModels = Array.from(modelCacheRef.current.keys());
    const modelsToRemove = currentModels.filter(fileName => !openTabs.includes(fileName));
    
    modelsToRemove.forEach(fileName => {
      const model = modelCacheRef.current.get(fileName);
      if (model && !model.isDisposed()) {
        model.dispose();
      }
      modelCacheRef.current.delete(fileName);
    });
  }, [openTabs]);

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
        return <div className="w-3 h-3 text-orange-500 text-xs font-bold flex items-center justify-center">H</div>;
      case 'css':
        return <div className="w-3 h-3 text-blue-500 text-xs font-bold flex items-center justify-center">C</div>;
      case 'js':
        return <div className="w-3 h-3 text-yellow-500 text-xs font-bold flex items-center justify-center">J</div>;
      default:
        return <div className="w-3 h-3 text-gray-400 text-xs font-bold flex items-center justify-center">T</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Editor Tabs */}
      <div className="bg-card border-b border-border flex items-center overflow-x-auto shrink-0" style={{ height: "40px" }}>
        {openTabs.map((fileName) => (
          <div
            key={fileName}
            className={`tab flex items-center space-x-2 px-4 py-2 border-r border-border cursor-pointer hover:bg-muted/50 transition-colors ${
              activeTab === fileName ? "active bg-background border-b-2 border-b-primary" : ""
            }`}
            onClick={() => onTabChange(fileName)}
            data-testid={`tab-${fileName}`}
          >
            {getFileIcon(fileName)}
            <span className="text-sm">{fileName.split('/').pop()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(fileName);
              }}
              data-testid={`button-close-tab-${fileName}`}
              className="h-4 w-4 p-0 ml-2 hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden" style={{ height: "calc(100% - 40px)" }}>
        {activeTab && getFileByPath(activeTab, files) ? (
          <div 
            ref={editorRef} 
            className="h-full w-full editor-font"
            data-testid="monaco-editor"
            style={{ height: "100%" }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl mb-2">📝</div>
              <div>Select a file to start editing</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
