import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";

const AuthLayout = () => {
  return (
    <>
      <Header />
      {/* .layout controls main inner flex region, Outlet */}
      <div className="layout">
        <Outlet />
      </div>
    </>
  );
};

export default AuthLayout;
