import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ParceleTest from "./views/test/ParceleTest";
import ParcelPage from "./views/test/ParcelPage";
import "./App.css";
import LoginView from "./views/auth/LoginView";
import RegistrationView from "./views/auth/RegistrationView";
import AppLayout from "./layouts/AppLayout";
import DashboardView from "./views/dashboard/DashboardView";
import ParcelaView from "./views/dashboard/ParcelaView";
import MapView from "./views/map/MapView";
import SettingsLayout from "./views/settings/SettingsLayout";
import SecurityTab from "./views/settings/SecurityTab";
import ProfileTab from "./views/settings/ProfileTab";
import DangerTab from "./views/settings/DangerTab";
import LanguageTab from "./views/settings/LanguageTab";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Testi */}
        <Route path="/test" element={<ParceleTest />} />
        <Route path="/test/parcela/:id" element={<ParcelPage />} />

        {/* Javni del */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegistrationView />} />

        {/* Glavna aplikacija */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" />} />

          {/* Parcele */}
          <Route path="dashboard">
            <Route index element={<DashboardView />} />
            <Route path=":id" element={<ParcelaView />} />
          </Route>
          <Route path="map" element={<MapView />} />

          {/* Nastavitve */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route path="profile" element={<ProfileTab />} />
            <Route path="security" element={<SecurityTab />} />
            <Route path="language" element={<LanguageTab />} />
            <Route path="danger" element={<DangerTab />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
