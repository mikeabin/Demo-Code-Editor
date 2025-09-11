import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Toolbar from "@/components/Toolbar";
import FileExplorer from "@/components/FileExplorer";
import EditorArea from "@/components/EditorArea";
import PreviewPanel from "@/components/PreviewPanel";
import StatusBar from "@/components/StatusBar";
import NewProjectModal from "@/components/NewProjectModal";
import SettingsModal from "@/components/SettingsModal";
import { type Project, type FileTree } from "@shared/schema";

export default function Editor() {
  const { id: projectId } = useParams<{ id?: string }>();
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("index.html");
  const [openTabs, setOpenTabs] = useState<string[]>(["index.html"]);
  const [activeTab, setActiveTab] = useState<string>("index.html");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState<FileTree>({});
  const [isResizing, setIsResizing] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(50); // percentage
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Utility function to update file by path in nested structure
  const updateFileByPath = (path: string, content: string, fileTree: FileTree): FileTree => {
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
  };

  // Get all projects to find the first one if no ID provided
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get current project
  const { data: currentProject, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  // Set initial project ID
  useEffect(() => {
    if (projectId) {
      setCurrentProjectId(projectId);
    } else if (projects && projects.length > 0 && !currentProjectId) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projectId, projects, currentProjectId]);

  // Update local files when project changes
  useEffect(() => {
    if (currentProject?.files) {
      const projectFiles = currentProject.files as FileTree;
      setFiles(projectFiles);
      
      // Reset tabs and selection for new project
      if (projectFiles["index.html"]) {
        setSelectedFile("index.html");
        setOpenTabs(["index.html"]);
        setActiveTab("index.html");
      } else {
        const firstFile = Object.keys(projectFiles).find(
          key => projectFiles[key].type === "file"
        );
        if (firstFile) {
          setSelectedFile(firstFile);
          setOpenTabs([firstFile]);
          setActiveTab(firstFile);
        }
      }
    }
  }, [currentProject]);

  const openTab = (fileName: string) => {
    if (!openTabs.includes(fileName)) {
      setOpenTabs([...openTabs, fileName]);
    }
    setActiveTab(fileName);
    setSelectedFile(fileName);
  };

  const closeTab = (fileName: string) => {
    const newTabs = openTabs.filter(tab => tab !== fileName);
    setOpenTabs(newTabs);
    
    if (activeTab === fileName) {
      const newActiveTab = newTabs.length > 0 ? newTabs[newTabs.length - 1] : "";
      setActiveTab(newActiveTab);
      setSelectedFile(newActiveTab);
    }
  };

  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/projects/${currentProjectId}/files`, files);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Saved",
        description: "Project files have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save project files. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveProjectMutation.mutate();
  };

  const handleMouseDown = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    startResize(e.clientX, side);
  };

  const handleTouchStart = (e: React.TouchEvent, side: 'left' | 'right') => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      startResize(touch.clientX, side);
    }
  };

  const startResize = (clientX: number, side: 'left' | 'right') => {
    setIsResizing(true);
    
    const handleMove = (moveClientX: number) => {
      const container = document.querySelector('.main-editor-container') as HTMLElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      
      if (side === 'left') {
        const newWidth = Math.max(200, Math.min(500, moveClientX - containerRect.left));
        setLeftPanelWidth(newWidth);
      } else if (side === 'right') {
        const newWidth = Math.max(300, containerRect.right - moveClientX);
        const percentage = Math.max(20, Math.min(80, (newWidth / containerRect.width) * 100));
        setRightPanelWidth(percentage);
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX);
      }
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const handleDownload = () => {
    // First save the project, then download
    if (files && Object.keys(files).length > 0 && currentProject) {
      // Create a download link
      const link = document.createElement('a');
      link.href = `/api/projects/${currentProjectId}/download`;
      link.download = `${currentProject.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `${currentProject.name}.zip is being downloaded.`,
      });
    }
  };

  if (isProjectLoading || !currentProject) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Toolbar 
        projects={projects || []}
        currentProject={currentProject}
        onProjectSelect={setCurrentProjectId}
        onNewProject={() => setIsModalOpen(true)}
        onSave={handleSave}
        isSaving={saveProjectMutation.isPending}
        onDownload={handleDownload}
        onSettings={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex flex-1 overflow-hidden main-editor-container">
        {!isExplorerCollapsed && (
          <div style={{ width: `${leftPanelWidth}px`, minWidth: "200px", maxWidth: "500px" }}>
            <FileExplorer
              files={files}
              selectedFile={selectedFile}
              onFileSelect={openTab}
              onFilesChange={setFiles}
              projectId={currentProjectId}
              onToggleCollapse={() => setIsExplorerCollapsed(true)}
              onFileRenamed={(oldPath, newPath) => {
                // Update open tabs - handle both file and folder renames
                const newTabs = openTabs.map(tab => {
                  if (tab === oldPath) {
                    return newPath;
                  } else if (tab.startsWith(oldPath + '/')) {
                    // Update paths for files inside renamed folder
                    return newPath + tab.substring(oldPath.length);
                  }
                  return tab;
                });
                setOpenTabs(newTabs);
                
                // Update active tab
                if (activeTab === oldPath) {
                  setActiveTab(newPath);
                } else if (activeTab.startsWith(oldPath + '/')) {
                  setActiveTab(newPath + activeTab.substring(oldPath.length));
                }
                
                // Update selected file
                if (selectedFile === oldPath) {
                  setSelectedFile(newPath);
                } else if (selectedFile.startsWith(oldPath + '/')) {
                  setSelectedFile(newPath + selectedFile.substring(oldPath.length));
                }
              }}
              onFileDeleted={(filePath) => {
                // Remove from open tabs - handle both file and folder deletions
                const newTabs = openTabs.filter(tab => {
                  // Remove the exact file/folder and any files inside a deleted folder
                  return tab !== filePath && !tab.startsWith(filePath + '/');
                });
                setOpenTabs(newTabs);
                
                // Handle active tab
                if (activeTab === filePath || activeTab.startsWith(filePath + '/')) {
                  const newActiveTab = newTabs.length > 0 ? newTabs[newTabs.length - 1] : "";
                  setActiveTab(newActiveTab);
                  setSelectedFile(newActiveTab);
                }
                
                // Handle selected file
                if (selectedFile === filePath || selectedFile.startsWith(filePath + '/')) {
                  const newSelectedFile = newTabs.length > 0 ? newTabs[newTabs.length - 1] : "";
                  setSelectedFile(newSelectedFile);
                }
              }}
            />
          </div>
        )}
        
        {isExplorerCollapsed && (
          <div className="w-8 bg-card border-r border-border flex flex-col items-center py-2">
            <button
              onClick={() => setIsExplorerCollapsed(false)}
              className="p-1 hover:bg-muted rounded"
              data-testid="button-expand-explorer"
              title="Expand Explorer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        
        <div 
          className="resizer cursor-col-resize hover:bg-primary" 
          onMouseDown={(e) => handleMouseDown(e, 'left')}
          onTouchStart={(e) => handleTouchStart(e, 'left')}
        />
        
        <div className="flex-1 min-w-0">
          <EditorArea
            files={files}
            openTabs={openTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onTabClose={closeTab}
            onFileChange={(fileName, content) => {
              setFiles(prev => updateFileByPath(fileName, content, prev));
            }}
            projectId={currentProjectId}
          />
        </div>
        
        <div 
          className="resizer cursor-col-resize hover:bg-primary" 
          onMouseDown={(e) => handleMouseDown(e, 'right')}
          onTouchStart={(e) => handleTouchStart(e, 'right')}
        />
        
        <div style={{ width: `${rightPanelWidth}%`, minWidth: "300px" }}>
          <PreviewPanel projectId={currentProjectId} />
        </div>
      </div>
      
      <StatusBar
        project={currentProject}
        activeFile={selectedFile}
        hasErrors={false}
        warningCount={0}
      />
      
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={(project) => {
          setCurrentProjectId(project.id);
          setIsModalOpen(false);
        }}
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChanged={() => {
          // Force Monaco editor to reload settings
          window.dispatchEvent(new CustomEvent('editor-settings-changed'));
        }}
      />
    </div>
  );
}
