import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function FinishingPanel() {
  const [selectedFinish, setSelectedFinish] = useState('natural');

  const finishes = [
    {
      id: 'natural',
      name: 'Naturel',
      description: 'Sans traitement',
      price: 0
    },
    {
      id: 'oiled',
      name: 'Huilé',
      description: 'Protection naturelle',
      price: 8
    },
    {
      id: 'varnished',
      name: 'Vernis',
      description: 'Protection brillante',
      price: 12
    },
    {
      id: 'painted',
      name: 'Peint',
      description: 'Couleur personnalisée',
      price: 15
    }
  ];

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Finition</CardTitle>
          <CardDescription>
            Traitement de surface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedFinish} onValueChange={setSelectedFinish}>
            <div className="space-y-3">
              {finishes.map((finish) => (
                <div key={finish.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={finish.id} id={finish.id} />
                  <Label 
                    htmlFor={finish.id} 
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{finish.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {finish.description}
                        </div>
                      </div>
                      <Badge variant={finish.price === 0 ? "secondary" : "outline"} className="text-xs">
                        {finish.price === 0 ? 'Gratuit' : `+${finish.price}€/m²`}
                      </Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

    </div>
  );
}