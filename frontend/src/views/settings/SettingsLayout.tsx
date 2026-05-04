import { Outlet } from "react-router-dom";

function SettingsLayout() {
  return (
    <div>
      <h1>Settings</h1>
      <Outlet />
    </div>
  )
}

export default SettingsLayout;
