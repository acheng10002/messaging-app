/* useNavigate - hook to change routes
useLocation - hook that gives me access to the current URL path */
import { useNavigate, useLocation } from "react-router-dom";
// custom hook to access global authentication state/logged in user info
import { useAuth } from "../../hooks/useAuth";
// custom hook returns a function that logs out the user and redirects them to root
import { useHandleLogout } from "../../hooks/useHandleLogout";
import "./Header.css";
// displays register and login/logout button conditionally
const Header = () => {
  // gives access to route navigation
  const navigate = useNavigate();
  // provides current URL path
  const location = useLocation();
  // destructures user from auth context
  const { user } = useAuth();
  // calls custom logout hook and passes navigate to allow redirection after logout
  const handleLogout = useHandleLogout(navigate);

  // hideButtons is true if path is either of the following routes
  const hideButtons =
    location.pathname === "/auth/login" ||
    location.pathname === "/users/register";

  return (
    <header className="header">
      {/* left-aligned user label */}
      <div className="left">
        {/* if user is logged in and path is not login or register, username label appears
        on left-side */}
        {user && !hideButtons && <span>{user.username}</span>}
      </div>
      {/* header title always shown */}
      <h1 className="title">Messaging App</h1>
      {/* right-aligned buttons */}
      <div className="buttons">
        {/* if path is not login or register and user is logged in, button says logout
        - onLogout handles logout 
        J1. LOGS OUT USER - Header.jsx, useHandleLogout.js, AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, auth.controller.js, UserForm.jsx 
        - handleLogout accesses logout from AuthContext and navigate users to root route */}
        {!hideButtons &&
          (user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            /* otherwise, Register and Login buttons show */
            <>
              <button onClick={() => navigate("/users/register")}>
                Register
              </button>
              <button onClick={() => navigate("/auth/login")}>Login</button>
            </>
          ))}
      </div>
    </header>
  );
};

export default Header;
