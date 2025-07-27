import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Header } from './dashboard/Header';
import { Dashboard } from './dashboard/Dashboard';
import { MainLoadingPage } from './components/loading/MainLoadingPage';
import { useLoadingStore } from './store/loadingStore';
import { useWoodMaterialSelectorInit } from './hooks/useWoodMaterialSelectorInit';

function App() {
  const { isAppLoading, initializeApp, setAppLoading } = useLoadingStore();
  
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
    return <MainLoadingPage onLoadingComplete={handleLoadingComplete} />;
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