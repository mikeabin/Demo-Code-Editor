import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy, Scissors } from "lucide-react";

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  fileName: string;
}

export default function ContextMenu({
  isOpen,
  position,
  onClose,
  onRename,
  onDelete,
  onCopy,
  onCut,
  fileName
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-card border border-border rounded-md shadow-lg z-50 py-1 min-w-[150px]"
      style={{
        left: position.x,
        top: position.y,
      }}
      data-testid="context-menu"
    >
      <div className="px-2 py-1 text-xs text-muted-foreground border-b border-border mb-1">
        {fileName}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full justify-start px-3 py-1.5 h-auto text-sm hover:bg-muted"
        data-testid="context-menu-rename"
      >
        <Edit className="w-3 h-3 mr-2" />
        Hernoemen
      </Button>

      {onCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCopy();
            onClose();
          }}
          className="w-full justify-start px-3 py-1.5 h-auto text-sm hover:bg-muted"
          data-testid="context-menu-copy"
        >
          <Copy className="w-3 h-3 mr-2" />
          Kopiëren
        </Button>
      )}

      {onCut && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCut();
            onClose();
          }}
          className="w-full justify-start px-3 py-1.5 h-auto text-sm hover:bg-muted"
          data-testid="context-menu-cut"
        >
          <Scissors className="w-3 h-3 mr-2" />
          Knippen
        </Button>
      )}

      <div className="border-t border-border my-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full justify-start px-3 py-1.5 h-auto text-sm hover:bg-destructive hover:text-destructive-foreground"
        data-testid="context-menu-delete"
      >
        <Trash2 className="w-3 h-3 mr-2" />
        Verwijderen
      </Button>
    </div>
  );
}