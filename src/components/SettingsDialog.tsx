import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme, themes } from '@/lib/ThemeContext';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: 'home' | 'student' | 'admin';
}

export function SettingsDialog({ open, onOpenChange, scope }: SettingsDialogProps) {
  const { getTheme, setTheme } = useTheme();
  const theme = getTheme(scope);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appearance Settings ({scope.charAt(0).toUpperCase() + scope.slice(1)})</DialogTitle>
          <DialogDescription>
            Customize how Fly Together looks and feels for this section.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {scope === 'admin' && (
            <div className="space-y-4">
              <Label className="text-base">Primary Brand Color</Label>
              <div className="flex items-center gap-4">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(scope, { primaryColor: t.oklch })}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all relative ring-offset-2",
                      theme.primaryColor === t.oklch ? "ring-2 ring-primary" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: t.color }}
                    title={t.name}
                  >
                    {theme.primaryColor === t.oklch && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className={cn("flex items-center justify-between pt-6", scope === 'admin' && "border-t")}>
            <div className="space-y-1">
              <Label className="text-base">Interface Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl">
              <span className={cn("text-sm font-medium transition-colors", !theme.isDarkMode ? "text-foreground" : "text-muted-foreground")}>Light</span>
              <Switch 
                id="dark-mode" 
                checked={theme.isDarkMode}
                onCheckedChange={(checked) => setTheme(scope, { isDarkMode: checked })}
              />
              <span className={cn("text-sm font-medium transition-colors", theme.isDarkMode ? "text-foreground" : "text-muted-foreground")}>Dark</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
