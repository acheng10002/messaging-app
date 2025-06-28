/* custom hook that gives access to the current value of AuthContext 
simplifies context consumption */
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => useContext(AuthContext);
