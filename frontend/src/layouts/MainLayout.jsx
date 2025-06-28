import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar />
        <Outlet />
      </div>
    </>
  );
};

export default MainLayout;
