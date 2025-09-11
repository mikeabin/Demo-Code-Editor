import { CheckCircle, AlertTriangle, Wifi } from "lucide-react";
import { type Project } from "@shared/schema";

interface StatusBarProps {
  project: Project;
  activeFile: string;
  hasErrors: boolean;
  warningCount: number;
}

export default function StatusBar({ 
  project, 
  activeFile, 
  hasErrors, 
  warningCount 
}: StatusBarProps) {
  const getFileLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'js':
        return 'JavaScript';
      case 'json':
        return 'JSON';
      case 'md':
        return 'Markdown';
      default:
        return 'Text';
    }
  };

  return (
    <div className="bg-primary text-primary-foreground h-6 flex items-center justify-between px-4 text-xs">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3 text-green-300" />
          <span>{hasErrors ? "Errors found" : "No errors"}</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-yellow-300" />
          <span>{warningCount} warnings</span>
        </div>
        <div>
          Project: <span data-testid="text-project-name">{project.name}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span data-testid="text-file-language">{getFileLanguage(activeFile)}</span>
        <span>UTF-8</span>
        <span>LF</span>
        <span data-testid="text-cursor-position">Ln 1, Col 1</span>
        <div className="flex items-center space-x-1">
          <Wifi className="w-3 h-3" />
          <span data-testid="text-server-status">Live Server: Running</span>
        </div>
      </div>
    </div>
  );
}
