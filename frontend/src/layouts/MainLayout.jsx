import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Header />
      <div className="layout">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
