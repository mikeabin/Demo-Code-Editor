import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Smartphone, Tablet, Monitor, ExternalLink, RefreshCw, Globe } from "lucide-react";

interface PreviewPanelProps {
  projectId: string;
}

export default function PreviewPanel({ projectId }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const openInNewTab = () => {
    window.open(`/api/projects/${projectId}/preview`, '_blank');
  };

  const getViewportStyles = () => {
    switch (viewMode) {
      case "mobile":
        return { maxWidth: "375px", margin: "0 auto" };
      case "tablet":
        return { maxWidth: "768px", margin: "0 auto" };
      default:
        return {};
    }
  };

  // No auto-refresh - only manual refresh

  return (
    <div className="w-full h-full bg-card border-l border-border flex flex-col">
      <div className="bg-secondary border-b border-border p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="text-primary w-4 h-4" />
          <span className="text-sm font-medium">Live Preview</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "mobile" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            data-testid="button-mobile-view"
            className="h-7 w-7 p-0"
            title="Mobile View"
          >
            <Smartphone className="w-3 h-3" />
          </Button>
          <Button
            variant={viewMode === "tablet" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("tablet")}
            data-testid="button-tablet-view"
            className="h-7 w-7 p-0"
            title="Tablet View"
          >
            <Tablet className="w-3 h-3" />
          </Button>
          <Button
            variant={viewMode === "desktop" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            data-testid="button-desktop-view"
            className="h-7 w-7 p-0"
            title="Desktop View"
          >
            <Monitor className="w-3 h-3" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={openInNewTab}
            data-testid="button-open-external"
            className="h-7 w-7 p-0"
            title="Open in New Tab"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshPreview}
            data-testid="button-refresh-preview"
            className="h-7 w-7 p-0"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="p-2 bg-muted border-b border-border">
        <div className="flex items-center space-x-2 bg-input border border-border rounded px-3 py-1">
          <Globe className="text-muted-foreground w-3 h-3" />
          <span className="text-xs text-muted-foreground">
            localhost:5000/api/projects/{projectId}/preview
          </span>
        </div>
      </div>

      {/* Preview Iframe */}
      <div className="flex-1 bg-white overflow-auto">
        <div style={getViewportStyles()} className="h-full">
          <iframe 
            ref={iframeRef}
            src={`/api/projects/${projectId}/preview`}
            className="w-full h-full border-0"
            data-testid="preview-iframe"
            title="Live Preview"
          />
        </div>
      </div>
    </div>
  );
}
