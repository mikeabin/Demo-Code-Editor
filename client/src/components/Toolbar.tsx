import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, Plus, FolderOpen, Save, Settings, Download } from "lucide-react";
import { type Project } from "@shared/schema";

interface ToolbarProps {
  projects: Project[];
  currentProject: Project;
  onProjectSelect: (projectId: string) => void;
  onNewProject: () => void;
  onSave: () => void;
  isSaving: boolean;
  onDownload: () => void;
  onSettings: () => void;
}

export default function Toolbar({ 
  projects, 
  currentProject, 
  onProjectSelect, 
  onNewProject,
  onSave,
  isSaving,
  onDownload,
  onSettings
}: ToolbarProps) {
  return (
    <div className="bg-secondary border-b border-border h-10 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Code className="text-primary h-5 w-5" />
          <span className="font-semibold text-sm">WebCode Editor</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            onClick={onNewProject}
            data-testid="button-new-project"
            className="h-7 px-3 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Project
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            data-testid="button-open-project"
            className="h-7 px-3 text-xs"
          >
            <FolderOpen className="w-3 h-3 mr-1" />
            Open
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            data-testid="button-save-project"
            className="h-7 px-3 text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onDownload}
            data-testid="button-download-project"
            className="h-7 px-3 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Select 
          value={currentProject.id} 
          onValueChange={onProjectSelect}
        >
          <SelectTrigger 
            className="w-48 h-7 text-xs"
            data-testid="select-project"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem 
                key={project.id} 
                value={project.id}
                data-testid={`option-project-${project.id}`}
              >
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onSettings}
          data-testid="button-settings"
          className="h-7 w-7 p-0"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
