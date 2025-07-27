import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { TreePine, Loader2, CheckCircle } from 'lucide-react';
import { useLoadingStore } from '@/store/loadingStore';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

interface MainLoadingPageProps {
  onLoadingComplete: () => void;
}

export function MainLoadingPage({ onLoadingComplete }: MainLoadingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'worker', label: 'Initialisation OpenCascade Worker...', status: 'pending' },
    { id: 'materials', label: 'Chargement des matières...', status: 'pending' },
    { id: 'components', label: 'Préparation des composants...', status: 'pending' },
    { id: 'selector', label: 'Initialisation WoodMaterialSelector...', status: 'pending' }
  ]);

  // Store state pour suivre l'avancement du chargement
  const { initializeApp } = useLoadingStore();

  useEffect(() => {
    // Animation d'entrée du logo
    gsap.fromTo(logoRef.current, 
      { scale: 0, rotation: -180, opacity: 0 },
      { 
        scale: 1, 
        rotation: 0, 
        opacity: 1, 
        duration: 1.2, 
        ease: "back.out(1.7)",
        delay: 0.3 
      }
    );

    // Animation de la barre de progression
    gsap.fromTo(progressBarRef.current,
      { scaleX: 0 },
      { 
        scaleX: 1, 
        duration: 0.8, 
        ease: "power2.inOut",
        delay: 0.8 
      }
    );

    // Animation des étapes
    gsap.fromTo(stepsRef.current?.children || [],
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.6, 
        stagger: 0.1,
        delay: 1.2 
      }
    );

    // Démarrer le processus de chargement
    startLoadingProcess();
  }, []);

  const startLoadingProcess = async () => {
    // Lancer l'initialisation de l'app (matières, composants)
    initializeApp();
    
    // Étape 1: Attendre OpenCascade Worker
    setCurrentStep(0);
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === 0 ? 'loading' : 'pending'
    })));

    // Attendre que le worker OpenCascade soit prêt
    console.log('⏳ [MainLoadingPage] En attente du worker OpenCascade...');
    while (!useLoadingStore.getState().isWorkerReady) {
      console.log('⏳ [MainLoadingPage] Worker pas encore prêt, attente... isWorkerReady:', useLoadingStore.getState().isWorkerReady);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('✅ [MainLoadingPage] Worker OpenCascade prêt !');

    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === 0 ? 'completed' : 'pending'
    })));

    // Étape 2: Matières
    setCurrentStep(1);
    console.log('⏳ [MainLoadingPage] Étape 2: Chargement matières...');
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === 1 ? 'loading' : i < 1 ? 'completed' : 'pending'
    })));

    // Attendre que les matières soient chargées
    while (!useLoadingStore.getState().isMaterialsLoaded) {
      console.log('⏳ [MainLoadingPage] Matières pas encore chargées, attente... isMaterialsLoaded:', useLoadingStore.getState().isMaterialsLoaded);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('✅ [MainLoadingPage] Matières chargées !');
    
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i <= 1 ? 'completed' : 'pending'
    })));

    // Étape 3: Composants  
    setCurrentStep(2);
    console.log('⏳ [MainLoadingPage] Étape 3: Chargement composants...');
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === 2 ? 'loading' : i < 2 ? 'completed' : 'pending'
    })));

    // Attendre que les composants soient chargés
    while (!useLoadingStore.getState().isComponentsLoaded) {
      console.log('⏳ [MainLoadingPage] Composants pas encore chargés, attente... isComponentsLoaded:', useLoadingStore.getState().isComponentsLoaded);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('✅ [MainLoadingPage] Composants chargés !');

    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i <= 2 ? 'completed' : 'pending'
    })));

    // Étape 4: Finalisation (attendre WoodMaterialSelector)
    setCurrentStep(3);
    console.log('⏳ [MainLoadingPage] Étape 4: Finalisation...');
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === 3 ? 'loading' : i < 3 ? 'completed' : 'pending'
    })));

    // Attendre que WoodMaterialSelector soit initialisé
    while (!useLoadingStore.getState().isWoodMaterialSelectorLoaded) {
      console.log('⏳ [MainLoadingPage] WoodMaterialSelector pas encore chargé, attente... isWoodMaterialSelectorLoaded:', useLoadingStore.getState().isWoodMaterialSelectorLoaded);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('✅ [MainLoadingPage] WoodMaterialSelector chargé !');
    
    setSteps(prev => prev.map(step => ({
      ...step,
      status: 'completed'
    })));

    console.log('🎉 [MainLoadingPage] Toutes les étapes terminées !');

    // Animations finales
    gsap.to(progressBarRef.current, {
      width: '100%',
      duration: 0.3,
      ease: "power2.out"
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        onLoadingComplete();
      }
    });
  };

  const getStepIcon = (step: LoadingStep) => {
    switch (step.status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-amber-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center z-50"
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Logo animé */}
        <div ref={logoRef} className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <TreePine className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">WoodcraftR</h1>
          <p className="text-gray-600 text-sm">
            Votre atelier de découpe bois personnalisé
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-8">
          <div 
            ref={progressBarRef}
            className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
          >
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: '0%' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Étape {currentStep + 1} sur {steps.length}
          </p>
        </div>

        {/* Liste des étapes */}
        <div ref={stepsRef} className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                step.status === 'loading' 
                  ? 'bg-amber-100 border border-amber-200' 
                  : step.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {getStepIcon(step)}
              <span className={`text-sm font-medium ${
                step.status === 'loading' 
                  ? 'text-amber-800' 
                  : step.status === 'completed'
                  ? 'text-green-800'
                  : 'text-gray-600'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Message de patience */}
        <div className="mt-8 text-xs text-gray-500">
          <p>Initialisation en cours, merci de patienter...</p>
        </div>
      </div>
    </div>
  );
}
