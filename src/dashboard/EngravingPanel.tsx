import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Settings,
  Zap,
  AlertTriangle,
  Download
} from 'lucide-react';

export function EngravingPanel() {

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Gravure suivant modèles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Modèles</Label>
            <Select defaultValue="balanced">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Rapide (+30% vitesse, -10% précision)</SelectItem>
                <SelectItem value="balanced">Équilibré (Standard)</SelectItem>
                <SelectItem value="precise">Précis (-20% vitesse, +15% précision)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres machine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Profondeur de Gravure</Label>
              <Input defaultValue="0.5" className="h-9" />
              <span className="text-xs text-muted-foreground">mm</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div className="text-xs text-amber-800 dark:text-amber-400">
              A définir en fonction de la profondeur de gravure
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gravure personalisées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Importer votre fichier
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}