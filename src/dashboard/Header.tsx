import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/dashboard/ThemeToggle';
import { 
  Save, 
  Download, 
  Upload, 
  Settings, 
  HelpCircle,
  Hammer 
} from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg">
                <Hammer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">WoodCraftR </h1>
                <p className="text-xs text-muted-foreground">Configurateur de découpe</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
              Version Développement
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            
            <Button variant="ghost" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>

            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>

            <ThemeToggle />
            
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}