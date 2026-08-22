import AppRoutes from './routes/AppRoutes';
import AppShell from './components/Layout/AppShell';

export default function App() {
  return (
    <AppShell>
      <AppRoutes />
    </AppShell>
  );
}
