import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Accounts from './pages/Accounts';
import BillsDebts from './pages/BillsDebts';
import Insights from './pages/Insights';
import Tracker from './pages/Tracker';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="tracker" element={<Tracker />} />
        <Route path="bills" element={<BillsDebts />} />
        <Route path="insights" element={<Insights />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
