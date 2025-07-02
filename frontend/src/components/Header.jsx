/* useNavigate - hook to change routes
useLocation - hook that gives me access to the current URL path */
import { useNavigate, useLocation } from "react-router-dom";
// custom hook to access global authentication state/logged in user info
import { useAuth } from "../hooks/useAuth";
// custom hook returns a function that logs the user out and redirects them to root
import { useHandleLogout } from "../hooks/useHandleLogout";
/* displays register and login/logout button conditionally 
default mode is access */
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
      <div className="header-left">
        {/* if user is logged in, button says logout
        - onLogout handles logout */}
        {user && !hideButtons && <span>{user.username}</span>}
      </div>
      {/* header title always shown */}
      <h1 className="header-title">Messaging App</h1>
      {/* right-aligned buttons */}
      <div className="header-buttons">
        {!hideButtons &&
          (user ? (
            <button className="other-button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <button onClick={() => navigate("/users/register")}>
                Register
              </button>
              {/* sends user to "/auth/login" */}
              <button
                className="other-button"
                onClick={() => navigate("/auth/login")}
              >
                Login
              </button>
            </>
          ))}
      </div>
    </header>
  );
};

export default Header;
