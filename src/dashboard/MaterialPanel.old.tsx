import { useState } from 'react';
import { useGlobalMaterialStore } from '@/store/globalMaterialStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TreePine,
  Info,
  Star,
  Hammer,
  Shield
} from 'lucide-react';

// Données des matières (importées du WoodMaterialSelector)
const materials: Material[] = [
  { id: 'oak', name: 'Chêne', image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'walnut', name: 'Noyer', image: 'https://images.pexels.com/photos/1108573/pexels-photo-1108573.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'maple', name: 'Érable', image: 'https://images.pexels.com/photos/129733/pexels-photo-129733.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'pine', name: 'Pin', image: 'https://images.pexels.com/photos/1267239/pexels-photo-1267239.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'cedar', name: 'Cèdre', image: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'birch', name: 'Bouleau', image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'cherry', name: 'Cerisier', image: 'https://images.pexels.com/photos/1108102/pexels-photo-1108102.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'mahogany', name: 'Acajou', image: 'https://images.pexels.com/photos/1108573/pexels-photo-1108573.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'ash', name: 'Frêne', image: 'https://images.pexels.com/photos/1108574/pexels-photo-1108574.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'beech', name: 'Hêtre', image: 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'teak', name: 'Teck', image: 'https://images.pexels.com/photos/1108103/pexels-photo-1108103.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' },
  { id: 'bamboo', name: 'Bambou', image: 'https://images.pexels.com/photos/1108575/pexels-photo-1108575.jpeg?auto=compress&cs=tinysrgb&w=120&h=100&fit=crop' }
];

// Données détaillées simplifiées pour le panneau
const materialInfo: Record<string, {
  characteristics: {
    density: string;
    hardness: string;
    durability: string;
    color: string;
  };
  applications: string[];
  description: string;
}> = {
  oak: {
    characteristics: { density: '0.75 g/cm³', hardness: 'Très dur', durability: 'Excellente', color: 'Brun doré' },
    applications: ['Parquets haut de gamme', 'Mobilier traditionnel', 'Charpente'],
    description: 'Le chêne est un bois noble reconnu pour sa robustesse exceptionnelle et sa longévité.'
  },
  walnut: {
    characteristics: { density: '0.65 g/cm³', hardness: 'Dur', durability: 'Bonne', color: 'Brun chocolat' },
    applications: ['Mobilier de luxe', 'Instruments de musique', 'Décoration intérieure'],
    description: 'Le noyer est prisé pour sa beauté naturelle et ses veines distinctives.'
  },
  maple: {
    characteristics: { density: '0.70 g/cm³', hardness: 'Dur', durability: 'Très bonne', color: 'Blanc crème' },
    applications: ['Parquets sportifs', 'Plans de travail', 'Mobilier moderne'],
    description: 'L\'érable offre une surface lisse et uniforme, parfaite pour les finitions modernes.'
  },
  pine: {
    characteristics: { density: '0.50 g/cm³', hardness: 'Tendre', durability: 'Moyenne', color: 'Jaune pâle' },
    applications: ['Construction légère', 'Mobilier rustique', 'Lambris'],
    description: 'Le pin est un bois résineux économique et polyvalent.'
  },
  cedar: {
    characteristics: { density: '0.38 g/cm³', hardness: 'Tendre', durability: 'Excellente', color: 'Rouge-brun' },
    applications: ['Bardage extérieur', 'Terrasses', 'Saunas'],
    description: 'Le cèdre est naturellement résistant aux insectes et à la pourriture.'
  },
  birch: {
    characteristics: { density: '0.65 g/cm³', hardness: 'Mi-dur', durability: 'Bonne', color: 'Blanc à jaune pâle' },
    applications: ['Contreplaqué', 'Mobilier scandinave', 'Jouets'],
    description: 'Le bouleau offre un grain fin et une couleur claire.'
  },
  cherry: {
    characteristics: { density: '0.60 g/cm³', hardness: 'Mi-dur', durability: 'Bonne', color: 'Rose saumon' },
    applications: ['Mobilier haut de gamme', 'Boiseries', 'Instruments'],
    description: 'Le cerisier développe une patine riche avec le temps.'
  },
  mahogany: {
    characteristics: { density: '0.55 g/cm³', hardness: 'Mi-dur', durability: 'Excellente', color: 'Brun rougeâtre' },
    applications: ['Mobilier de luxe', 'Bateaux', 'Instruments de musique'],
    description: 'L\'acajou est le bois de référence pour le mobilier de luxe.'
  },
  ash: {
    characteristics: { density: '0.75 g/cm³', hardness: 'Dur', durability: 'Bonne', color: 'Blanc crème' },
    applications: ['Manches d\'outils', 'Articles de sport', 'Parquets'],
    description: 'Le frêne est reconnu pour sa résistance exceptionnelle aux chocs.'
  },
  beech: {
    characteristics: { density: '0.72 g/cm³', hardness: 'Dur', durability: 'Moyenne', color: 'Blanc rosé' },
    applications: ['Mobilier', 'Jouets', 'Ustensiles de cuisine'],
    description: 'Le hêtre offre un grain fin et régulier.'
  },
  teak: {
    characteristics: { density: '0.67 g/cm³', hardness: 'Dur', durability: 'Exceptionnelle', color: 'Brun doré' },
    applications: ['Mobilier de jardin', 'Ponts de bateaux', 'Salles de bain'],
    description: 'Le teck est le roi des bois exotiques.'
  },
  bamboo: {
    characteristics: { density: '0.60 g/cm³', hardness: 'Mi-dur', durability: 'Bonne', color: 'Jaune pâle' },
    applications: ['Parquets écologiques', 'Mobilier moderne', 'Cloisons'],
    description: 'Le bambou est une alternative écologique moderne.'
  }
};

export function MaterialPanel() {
  const { 
    materials, 
    isLoaded,
    getMaterialById
  } = useGlobalMaterialStore();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterialId(materialId);
  };

  const selectedMaterial = selectedMaterialId ? getMaterialById(selectedMaterialId) : null;

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Sélection de la matière */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TreePine className="w-4 h-4" />
            Sélection de Matière
          </CardTitle>
          <CardDescription className="text-xs">
            Choisissez le type de bois pour votre panneau
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedMaterial && selectedMaterial.id !== 'none' ? (
            <div className="space-y-3">
              {/* Matière sélectionnée */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedMaterial.image} 
                    alt={selectedMaterial.name}
                    className="w-12 h-10 object-cover rounded border"
                  />
                  <div>
                    <p className="font-medium text-sm">{selectedMaterial.name}</p>
                    <p className="text-xs text-amber-700">Matière sélectionnée</p>
                  </div>
                </div>
              </div>
              
              {/* Sélecteur rapide */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Sélection rapide :</p>
                <div className="grid grid-cols-3 gap-2">
                  {materials.slice(0, 6).map((material) => (
                    <button
                      key={material.id}
                      onClick={() => handleMaterialSelect(material)}
                      className={`p-2 rounded-lg border transition-all text-xs flex flex-col items-center gap-1 ${
                        selectedMaterial.id === material.id
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-white border-gray-200 hover:border-amber-200 text-gray-700'
                      }`}
                    >
                      <img 
                        src={material.image} 
                        alt={material.name}
                        className="w-8 h-6 object-cover rounded"
                      />
                      <span className="truncate w-full text-center">{material.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Pour voir toutes les matières (12), passez à l'onglet Matière dans la vue principale.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* État "Aucune matière" */}
              <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="w-16 h-12 mx-auto mb-2 flex items-center justify-center">
                  <img 
                    src="/placeholder-material.svg" 
                    alt="Aucune matière"
                    className="w-full h-full opacity-60"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-1">Aucune matière sélectionnée</p>
                <p className="text-xs text-gray-500">
                  Sélectionnez une matière ci-dessous ou utilisez la vue 3D principale.
                </p>
              </div>
              
              {/* Sélecteur rapide */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Matières populaires :</p>
                <div className="grid grid-cols-2 gap-2">
                  {materials.slice(0, 4).map((material) => (
                    <button
                      key={material.id}
                      onClick={() => handleMaterialSelect(material)}
                      className="p-2 rounded-lg border border-gray-200 hover:border-amber-200 transition-all text-xs flex flex-col items-center gap-1 bg-white text-gray-700"
                    >
                      <img 
                        src={material.image} 
                        alt={material.name}
                        className="w-8 h-6 object-cover rounded"
                      />
                      <span className="truncate w-full text-center">{material.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations détaillées de la matière sélectionnée */}
      {selectedMaterial && selectedMaterial.id !== 'none' && selectedInfo && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedInfo.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Caractéristiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-amber-50 p-2 rounded border">
                  <div className="text-xs text-amber-700 font-medium">Densité</div>
                  <div className="text-xs text-gray-800">{selectedInfo.characteristics.density}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded border">
                  <div className="text-xs text-amber-700 font-medium">Dureté</div>
                  <div className="text-xs text-gray-800">{selectedInfo.characteristics.hardness}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded border">
                  <div className="text-xs text-amber-700 font-medium">Durabilité</div>
                  <div className="text-xs text-gray-800">{selectedInfo.characteristics.durability}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded border">
                  <div className="text-xs text-amber-700 font-medium">Couleur</div>
                  <div className="text-xs text-gray-800">{selectedInfo.characteristics.color}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hammer className="w-4 h-4 text-blue-500" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {selectedInfo.applications.map((app, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
                    {app}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Badge de validation */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Matière validée pour découpe
            </Badge>
          </div>
        </>
      )}
    </div>
  );
}
