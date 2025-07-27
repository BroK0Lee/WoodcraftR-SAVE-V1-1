import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Header } from './dashboard/Header';
import { Dashboard } from './dashboard/Dashboard';
import { MainLoadingPage } from './components/loading/MainLoadingPage';
import ContentViewer from './components/ContentViewer';
import { useLoadingStore } from './store/loadingStore';
import { useWoodMaterialSelectorInit } from './hooks/useWoodMaterialSelectorInit';
import { useOpenCascadeWorker } from './hooks/useOpenCascadeWorker';

function App() {
  const { isAppLoading, initializeApp, setAppLoading } = useLoadingStore();
  
  // Initialiser le worker OpenCascade une seule fois au niveau App
  useOpenCascadeWorker();
  
  // Initialiser WoodMaterialSelector en parallèle
  useWoodMaterialSelectorInit();

  useEffect(() => {
    // Démarrer l'initialisation au montage du composant
    initializeApp();
  }, [initializeApp]);

  const handleLoadingComplete = () => {
    setAppLoading(false);
  };

  if (isAppLoading) {
    return (
      <>
        {/* ContentViewer monté en arrière-plan pour initialiser le worker OpenCascade */}
        <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}>
          <ContentViewer />
        </div>
        <MainLoadingPage onLoadingComplete={handleLoadingComplete} />
      </>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <Header />
        <Dashboard />
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;