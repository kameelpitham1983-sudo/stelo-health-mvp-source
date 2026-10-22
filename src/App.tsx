import { AppProvider, useApp } from '@/context/AppContext';
import { Login } from '@/pages/Login';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Companies } from '@/pages/Companies';
import { Employees } from '@/pages/Employees';
import { Medicals } from '@/pages/Medicals';
import { Appointments } from '@/pages/Appointments';
import { TravelHealth } from '@/pages/TravelHealth';
import { Documents } from '@/pages/Documents';
import { Reports } from '@/pages/Reports';
import { SteloAI } from '@/pages/SteloAI';
import { Settings } from '@/pages/Settings';
import { Synopsis } from '@/pages/Synopsis';
import { SicknessAbsence } from '@/pages/SicknessAbsence';
import { VisaMedicals } from '@/pages/VisaMedicals';
import { Providers } from '@/pages/Providers';

function AppContent() {
  const { user, currentPage } = useApp();

  if (!user) return <Login />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    synopsis: <Synopsis />,
    companies: <Companies />,
    employees: <Employees />,
    medicals: <Medicals />,
    appointments: <Appointments />,
    sickness: <SicknessAbsence />,
    travel: <TravelHealth />,
    visa: <VisaMedicals />,
    providers: <Providers />,
    documents: <Documents />,
    reports: <Reports />,
    ai: <SteloAI />,
    settings: <Settings />,
  };

  return <Layout>{pages[currentPage]}</Layout>;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
