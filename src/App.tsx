import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Header } from "./dashboard/Header";
import { Dashboard } from "./dashboard/Dashboard";
import { MainLoadingPage } from "./components/loading/MainLoadingPage";
// import ContentViewer from './components/ContentViewer'; (plus nécessaire tant que le worker n'a pas besoin du viewer pour init)
import { useLoadingStore } from "./store/loadingStore";
// Initialisations déplacées dans MainLoadingPage pour éviter double init.

function App() {
  const { isAppLoading, setAppLoading } = useLoadingStore();

  const handleLoadingComplete = () => {
    setAppLoading(false);
  };

  if (isAppLoading) {
    return (
      <>
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
