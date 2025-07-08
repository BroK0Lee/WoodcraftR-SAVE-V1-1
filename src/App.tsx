import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Header } from './dashboard/Header';
import { Dashboard } from './dashboard/Dashboard';

function App() {
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