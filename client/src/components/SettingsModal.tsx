import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSettingsChanged }: SettingsModalProps) {
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState([14]);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [autoSave, setAutoSave] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('editor-settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setTheme(settings.theme || "dark");
          setFontSize([settings.fontSize || 14]);
          setWordWrap(settings.wordWrap !== false);
          setMinimap(settings.minimap || false);
          setAutoSave(settings.autoSave || false);
        } catch (e) {
          console.warn('Failed to load settings:', e);
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    // Save settings to localStorage
    const settings = {
      theme,
      fontSize: fontSize[0],
      wordWrap,
      minimap,
      autoSave
    };
    localStorage.setItem('editor-settings', JSON.stringify(settings));
    
    // Notify parent that settings changed
    if (onSettingsChanged) {
      onSettingsChanged();
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-settings">
        <DialogHeader>
          <DialogTitle>Editor Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark" data-testid="option-theme-dark">Dark</SelectItem>
                <SelectItem value="light" data-testid="option-theme-light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size: {fontSize[0]}px</Label>
            <Slider
              value={fontSize}
              onValueChange={setFontSize}
              max={24}
              min={10}
              step={1}
              data-testid="slider-font-size"
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="wordWrap" className="text-sm font-medium">
              Word Wrap
            </Label>
            <Switch
              id="wordWrap"
              checked={wordWrap}
              onCheckedChange={setWordWrap}
              data-testid="switch-word-wrap"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="minimap" className="text-sm font-medium">
              Show Minimap
            </Label>
            <Switch
              id="minimap"
              checked={minimap}
              onCheckedChange={setMinimap}
              data-testid="switch-minimap"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoSave" className="text-sm font-medium">
              Auto Save
            </Label>
            <Switch
              id="autoSave"
              checked={autoSave}
              onCheckedChange={setAutoSave}
              data-testid="switch-auto-save"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={onClose}
              data-testid="button-cancel-settings"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              data-testid="button-save-settings"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}