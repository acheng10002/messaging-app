// custom hook to access logged in user info
import { useAuth } from "./useAuth";

/* J2. LOGS OUT USER - Header.jsx, useHandleLogout.js, AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, auth.controller.js, UserForm.jsx  
- custom hook that accesses logout from AuthContext and navigate users to root route */
export const useHandleLogout = (navigate) => {
  const { logout } = useAuth();

  return () => {
    logout();
    navigate("/");
  };
};
