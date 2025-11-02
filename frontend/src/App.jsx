import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import MyTasks from './pages/MyTasks';
import Calendar from './pages/Calendar';
import Notification from './pages/Notification';
import Settings from './pages/Settings';
// sau này thêm Dashboard, NotFound,...

function App() {
  return (
    <Routes>
      {/* trang mặc định */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* login */}
      <Route path="/login" element={<LoginPage />} />

      {/* home */}
      <Route path="/" element={<MainLayout />}>
      <Route path="/home" element={<HomePage />} />
      <Route path="/tasks" element={<MyTasks />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/notifications" element={<Notification />} />
      <Route path="/settings" element={<Settings />} />
      </Route>

      {/* fallback 404 */}
      <Route path="*" element={<div>404 - Page not found</div>} />
    </Routes>
  );
}

export default App;