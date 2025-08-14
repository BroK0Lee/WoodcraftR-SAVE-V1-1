import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Header } from "./dashboard/Header";
import { Dashboard } from "./dashboard/Dashboard";
import { MainLoadingPage } from "./components/loading/MainLoadingPage";
import { useLoadingStore } from "./store/loadingStore";

function App() {
  const { isAppLoading, setAppLoading } = useLoadingStore();
  const handleLoadingComplete = () => setAppLoading(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background relative">
        <Header />
        <Dashboard />
        <Toaster position="top-right" />
        {/* Overlay de chargement permanent, visible controlé par store */}
        <MainLoadingPage
          onLoadingComplete={handleLoadingComplete}
          visible={isAppLoading}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
