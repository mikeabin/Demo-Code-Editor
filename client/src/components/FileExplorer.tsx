import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FilePlus, FolderPlus, RefreshCw, Folder, FolderOpen, FileText, ChevronLeft } from "lucide-react";
import { type FileTree, type FileNode } from "@shared/schema";
import ContextMenu from "./ContextMenu";

interface FileExplorerProps {
  files: FileTree;
  selectedFile: string;
  onFileSelect: (fileName: string) => void;
  onFilesChange: (files: FileTree) => void;
  projectId: string;
  onToggleCollapse?: () => void;
  onFileRenamed?: (oldPath: string, newPath: string) => void;
  onFileDeleted?: (filePath: string) => void;
}

export default function FileExplorer({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onFilesChange,
  projectId,
  onToggleCollapse,
  onFileRenamed,
  onFileDeleted
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    filePath: string;
  }>({ isOpen: false, position: { x: 0, y: 0 }, filePath: "" });
  const queryClient = useQueryClient();

  const updateFilesMutation = useMutation({
    mutationFn: async (updatedFiles: FileTree) => {
      const response = await apiRequest("PUT", `/api/projects/${projectId}/files`, updatedFiles);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType === "folder") {
      const isExpanded = expandedFolders.includes(fileName);
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }

    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
        return <div className="w-4 h-4 text-orange-500 text-xs font-bold flex items-center justify-center">H</div>;
      case 'css':
        return <div className="w-4 h-4 text-blue-500 text-xs font-bold flex items-center justify-center">C</div>;
      case 'js':
        return <div className="w-4 h-4 text-yellow-500 text-xs font-bold flex items-center justify-center">J</div>;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderName) 
        ? prev.filter(f => f !== folderName)
        : [...prev, folderName]
    );
  };

  const addNewFile = (parentPath?: string) => {
    const fileName = prompt("Enter file name:");
    if (fileName && fileName.trim()) {
      const newFiles = { ...files };
      const fileNode: FileNode = {
        name: fileName,
        type: "file",
        content: ""
      };

      if (parentPath) {
        // Add to specific folder
        const pathParts = parentPath.split('/');
        let current: any = newFiles;
        for (const part of pathParts) {
          if (current[part] && current[part].type === "folder") {
            current = current[part].children = current[part].children || {};
          }
        }
        if (!current[fileName]) {
          current[fileName] = fileNode;
        }
      } else {
        // Add to root
        if (!newFiles[fileName]) {
          newFiles[fileName] = fileNode;
        }
      }

      onFilesChange(newFiles);
      updateFilesMutation.mutate(newFiles);
    }
  };

  const addNewFolder = (parentPath?: string) => {
    const folderName = prompt("Enter folder name:");
    if (folderName && folderName.trim()) {
      const newFiles = { ...files };
      const folderNode: FileNode = {
        name: folderName,
        type: "folder",
        children: {}
      };

      if (parentPath) {
        // Add to specific folder
        const pathParts = parentPath.split('/');
        let current: any = newFiles;
        for (const part of pathParts) {
          if (current[part] && current[part].type === "folder") {
            current = current[part].children = current[part].children || {};
          }
        }
        if (!current[folderName]) {
          current[folderName] = folderNode;
        }
      } else {
        // Add to root
        if (!newFiles[folderName]) {
          newFiles[folderName] = folderNode;
        }
      }

      onFilesChange(newFiles);
      updateFilesMutation.mutate(newFiles);
    }
  };

  const deleteFileOrFolder = (filePath: string) => {
    if (confirm(`Weet je zeker dat je "${filePath}" wilt verwijderen?`)) {
      const newFiles = { ...files };
      const pathParts = filePath.split('/');
      
      if (pathParts.length === 1) {
        // Root level
        delete newFiles[pathParts[0]];
      } else {
        // Nested
        let current: any = newFiles;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (current[pathParts[i]] && current[pathParts[i]].children) {
            current = current[pathParts[i]].children;
          }
        }
        delete current[pathParts[pathParts.length - 1]];
      }
      
      onFilesChange(newFiles);
      updateFilesMutation.mutate(newFiles);
      
      // Notify parent about deletion
      if (onFileDeleted) {
        onFileDeleted(filePath);
      }
    }
  };

  const renameFileOrFolder = (filePath: string) => {
    const currentName = filePath.split('/').pop() || '';
    const newName = prompt("Nieuwe naam:", currentName);
    
    if (newName && newName !== currentName && newName.trim()) {
      const newFiles = { ...files };
      const pathParts = filePath.split('/');
      const parentPath = pathParts.slice(0, -1).join('/');
      const newFilePath = parentPath ? `${parentPath}/${newName}` : newName;
      
      // Get the file/folder data
      let current: any = newFiles;
      for (const part of pathParts.slice(0, -1)) {
        if (current[part] && current[part].children) {
          current = current[part].children;
        }
      }
      
      const fileData = current[currentName];
      if (fileData) {
        // Update name and recreate with new key
        fileData.name = newName;
        current[newName] = fileData;
        delete current[currentName];
        
        onFilesChange(newFiles);
        updateFilesMutation.mutate(newFiles);
        
        // Update selection if this file was selected
        if (selectedFile === filePath) {
          onFileSelect(newFilePath);
        }

        // Notify parent about rename for tab management
        if (onFileRenamed) {
          onFileRenamed(filePath, newFilePath);
        }
      }
    }
  };

  const renderFileItem = (fileName: string, file: FileNode, level = 0, parentPath = "") => {
    const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    const isSelected = selectedFile === fullPath;
    const isFolder = file.type === "folder";
    const isExpanded = expandedFolders.includes(fullPath);

    return (
      <div key={fullPath}>
        <div
          className={`file-item flex items-center space-x-2 px-2 py-1 rounded cursor-pointer text-sm ml-${level * 4} group ${
            isSelected ? "selected bg-accent text-accent-foreground" : "hover:bg-muted"
          }`}
          onClick={() => {
            if (isFolder) {
              toggleFolder(fullPath);
            } else {
              onFileSelect(fullPath);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({
              isOpen: true,
              position: { x: e.clientX, y: e.clientY },
              filePath: fullPath
            });
          }}
          data-testid={`file-item-${fullPath.replace(/\//g, '-')}`}
        >
          {getFileIcon(fileName, file.type)}
          <span className="flex-1">{fileName}</span>
          
          {/* Context menu for folders */}
          {isFolder && (
            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addNewFile(fullPath);
                }}
                data-testid={`button-new-file-in-${fullPath.replace(/\//g, '-')}`}
                className="h-4 w-4 p-0 hover:bg-muted"
                title="New File"
              >
                <FilePlus className="w-2 h-2" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addNewFolder(fullPath);
                }}
                data-testid={`button-new-folder-in-${fullPath.replace(/\//g, '-')}`}
                className="h-4 w-4 p-0 hover:bg-muted"
                title="New Folder"
              >
                <FolderPlus className="w-2 h-2" />
              </Button>
            </div>
          )}
        </div>
        
        {isFolder && isExpanded && file.children && (
          <div className="ml-4">
            {Object.entries(file.children).map(([childName, childFile]) =>
              renderFileItem(childName, childFile, level + 1, fullPath)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground">Explorer</span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addNewFile()}
              data-testid="button-new-file"
              className="h-6 w-6 p-0 hover:bg-muted"
              title="New File"
            >
              <FilePlus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addNewFolder()}
              data-testid="button-new-folder"
              className="h-6 w-6 p-0 hover:bg-muted"
              title="New Folder"
            >
              <FolderPlus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-refresh"
              className="h-6 w-6 p-0 hover:bg-muted"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                data-testid="button-collapse-explorer"
                className="h-6 w-6 p-0 hover:bg-muted"
                title="Collapse Explorer"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {Object.entries(files).map(([fileName, file]) =>
            renderFileItem(fileName, file)
          )}
        </div>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        fileName={contextMenu.filePath.split('/').pop() || ''}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        onRename={() => renameFileOrFolder(contextMenu.filePath)}
        onDelete={() => deleteFileOrFolder(contextMenu.filePath)}
      />
    </div>
  );
}
