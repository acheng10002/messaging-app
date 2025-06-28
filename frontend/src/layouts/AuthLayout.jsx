import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const AuthLayout = () => {
  return (
    <>
      <Header />
      <div className="layout">
        <Outlet />
      </div>
    </>
  );
};

export default AuthLayout;
