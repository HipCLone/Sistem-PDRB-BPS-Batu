import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppErrorBoundary } from './components/ErrorBoundary';
import Protected from './components/Protected';
import Shell from './components/Shell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataList from './pages/DataList';
import DatasetPage from './pages/DatasetPage';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App(){
  const location=useLocation();
  return <AppErrorBoundary resetKey={location.key}>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/*" element={<Protected><Shell><Routes>
        <Route path="beranda" element={<Dashboard/>}/>
        <Route path="data" element={<DataList/>}/>
        <Route path="data/:id" element={<DatasetPage/>}/>
        <Route path="notifications" element={<Notifications/>}/>
        <Route path="profile" element={<Profile/>}/>
        <Route path="*" element={<NotFound/>}/>
      </Routes></Shell></Protected>}/>
    </Routes>
  </AppErrorBoundary>;
}
