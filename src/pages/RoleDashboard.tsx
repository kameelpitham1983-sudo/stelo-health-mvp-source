import { useApp } from '@/context/AppContext';
import { Dashboard } from '@/pages/Dashboard';
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard';
import { CoordinatorDashboard } from '@/pages/dashboards/CoordinatorDashboard';
import { ProviderDashboard } from '@/pages/dashboards/ProviderDashboard';
import { EmployerDashboard } from '@/pages/dashboards/EmployerDashboard';
import { EmployeeDashboard } from '@/pages/dashboards/EmployeeDashboard';
import { LabDashboard } from '@/pages/dashboards/LabDashboard';

export function RoleDashboard() {
  const { user } = useApp();
  switch (user?.role) {
    case 'master_admin':
    case 'admin':
      return (
        <div className="space-y-10">
          <AdminDashboard />
          <Dashboard />
        </div>
      );
    case 'coordinator':
      return (
        <div className="space-y-10">
          <CoordinatorDashboard />
          <Dashboard />
        </div>
      );
    case 'provider':
      return <ProviderDashboard />;
    case 'employer':
      return <EmployerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'lab':
      return <LabDashboard />;
    default:
      return <Dashboard />;
  }
}
