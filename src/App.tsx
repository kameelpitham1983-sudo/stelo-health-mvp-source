import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Login } from '@/pages/Login';
import { Layout } from '@/components/Layout';
import { RoleDashboard } from '@/pages/RoleDashboard';
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
import { GOPs } from '@/pages/GOPs';
import { Accommodation } from '@/pages/Accommodation';
import { Workflows } from '@/pages/Workflows';
import { Certificates } from '@/pages/Certificates';
import { AuditLog } from '@/pages/AuditLog';
import { CaseManagement } from '@/pages/CaseManagement';
import { CaseDetail } from '@/pages/CaseDetail';
import { LearningCentre } from '@/pages/LearningCentre';
import { Onboarding } from '@/pages/Onboarding';
import { Screening } from '@/pages/Screening';
import { GuidedOnboarding } from '@/components/GuidedOnboarding';
import { canAccessPage } from '@/lib/permissions';

function AppContent() {
  const { user, currentPage, authReady, setPage, showOnboarding, startOnboarding, completeOnboarding } = useApp();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  if (!authReady) return <div className="min-h-screen flex items-center justify-center bg-ink-50"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!user) return <Login />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <RoleDashboard />,
    workflows: <Workflows />,
    synopsis: <Synopsis />,
    certificates: <Certificates />,
    companies: <Companies />,
    employees: <Employees />,
    medicals: <Medicals />,
    appointments: <Appointments />,
    sickness: <SicknessAbsence />,
    travel: <TravelHealth />,
    visa: <VisaMedicals />,
    providers: <Providers />,
    gops: <GOPs />,
    accommodation: <Accommodation />,
    documents: <Documents />,
    reports: <Reports />,
    ai: <SteloAI />,
    settings: <Settings />,
    audit: <AuditLog />,
    cases: <CaseManagement onOpenCase={(id) => { setSelectedCaseId(id); setPage('caseDetail'); }} />,
    caseDetail: selectedCaseId ? <CaseDetail caseId={selectedCaseId} onBack={() => setPage('cases')} /> : null,
    learning: <LearningCentre onStartOnboarding={startOnboarding} onboardingCompleted={!showOnboarding} />,
    onboarding: <Onboarding />,
    screening: <Screening />,
  };
  const allowed = canAccessPage(user.role, currentPage);
  return (
    <Layout>
      {allowed ? pages[currentPage] : <RoleDashboard />}
      {showOnboarding && <GuidedOnboarding onComplete={completeOnboarding} onOpenPage={setPage} />}
    </Layout>
  );
}

function App() { return <AppProvider><AppContent /></AppProvider>; }
export default App;
