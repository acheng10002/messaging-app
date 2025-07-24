import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";

const MainLayout = () => {
  return (
    /* .main-layout wraps entire app structure (header + body) in 
    authenticated views */
    <div className="main-layout">
      <Header />
      {/* .layout controls main inner flex region, Sidebar + Outlet */}
      <div className="layout">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
