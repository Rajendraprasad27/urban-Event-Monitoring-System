import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import LiveMonitoring from './pages/LiveMonitoring';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="monitoring" element={<LiveMonitoring />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
