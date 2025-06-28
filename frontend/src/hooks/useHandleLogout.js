// custom hook to access logged in user info
import { useAuth } from "./useAuth";

/* custom hook that accesses logout from AuthContext and 
navigate users to root route */
export const useHandleLogout = (navigate) => {
  const { logout } = useAuth();

  return () => {
    logout();
    navigate("/");
  };
};
