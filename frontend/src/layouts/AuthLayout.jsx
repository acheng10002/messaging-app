/* placeholder for rendering child routes 
- nesting routing - keeps layout components like headers, nav, and sidebars  persistent 
  while child views change
- encapsulation - each route controls only what it renders, including how and where its
  children display */
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
