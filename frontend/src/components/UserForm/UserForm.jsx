import { useState, useEffect } from "react";
// custom function to run client-side validation on the form data
import { validateUserForm } from "../../validation/validateUserForm";
import { useAuth } from "../../hooks/useAuth";
import "./UserForm.css";

// mode prop determines whether this is a login or register form
const UserForm = ({ mode, onRegisterSuccess, onLoginSuccess }) => {
  // retrieves updater function for token and user
  const { register, login } = useAuth();
  // isLogin is true if mode is login, false otherwise
  const isLogin = mode === "login";
  const isNewUser = mode === "new-user";

  // initializes state variables for each input
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  // error for a general error message
  const [error, setError] = useState(null);
  // list of specific validation errors
  const [errorList, setErrorList] = useState([]);

  useEffect(() => {
    setName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setPasswordConfirmation("");
    setError(null);
    setErrorList([]);
  }, [mode]);

  /* J8. LOGS OUT USER - Header.jsx, useHandleLogout.js, AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, auth.controller.js, auth.service.js, UUserForm.jsx 
     user gets navigate to root after logging out */
  if (isNewUser) {
    return (
      <div className="form-container">
        <h2>Welcome</h2>
        <p>Please register or log in if you have an account.</p>
      </div>
    );
  }
  /* H1. REGISTERS USER - UserForm.jsx, AuthContext.jsx, users.routes.js, userValidation.js, validate.js, users.controller.js, user.service.js, auth.service.js, UUserForm.jsx 
  - handleSubmit validates input on the client
  I1. LOGS IN USER - UserForm.jsx, AuthContext.jsx, auth.routes.js, passport.js, auth.controller.js, UserForm.jsx 
  - handleSubmit sends a POST request to /auth/login via fetch
    header is "Content-Type": "application/json"
    payload is new URLSearchParams({ username, password }) */
  const handleSubmit = async (e) => {
    e.preventDefault();
    // resets any previous error state
    setError(null);
    // passes all relevant form state into the imported validator function
    const validationErrors = validateUserForm({
      name,
      username,
      email,
      password,
      passwordConfirmation,
      isLogin,
    });
    // if there are validation errors, display them and aborts the request
    if (validationErrors.length > 0) {
      setErrorList(validationErrors);
      return;
    }

    try {
      if (!isLogin) {
        /* H8. REGISTERS USER - UserForm.jsx, AuthContext.jsx, users.routes.js, userValidation.js, validate.js, user.controller.js, users.service.js, UserForm.jsx 
        - client handles server response, calls onRegisterSuccess()
        - defined in App.js, navigate("/auth/login"); */
        await register({
          name,
          username,
          email,
          password,
          passwordConfirmation,
        });
        onRegisterSuccess();
      } else {
        /* I7. LOGS IN USER - UserForm.jsx, AuthContext.jsx, auth.routes.js, passport.js, auth.controller.js, UserForm.jsx 
        - client receives JWT and stores it
        - on login success, calls setTokenAndUser from useAuth and navigates to /users/:id/chats
        - uses login() from useAuth() */
        const result = await login(username, password);
        if (!result || !result.user) {
          setError("Login failed");
          return;
        }
        onLoginSuccess(result.user);
      }
    } catch (err) {
      // catches network or server errors
      setError(
        `${isLogin ? "Login" : "Registration"} failed: ${err.message || "Unknown error"}`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {/* displays a heading based on the mode */}
      <h2>{isLogin ? "Login" : "Register"}</h2>
      {/* if in registration mode, shows a field for the user's name */}
      {!isLogin && (
        <>
          <div className="form-group">
            <label>Name:</label>
            <input
              className="user-form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              className="user-form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </>
      )}
      {/* username and password are common to both login and register forms */}
      <div className="form-group">
        <label>Username:</label>
        <input
          className="user-form-input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Password:</label>
        <input
          className="user-form-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {/* if in registration mode, shows a field to confirm password */}
      {!isLogin && (
        <>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              className="user-form-input"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
          </div>
        </>
      )}
      {/* if multiple validation errors, renders them as a list */}
      {errorList.length > 0 && (
        <ul className="error">
          {/* for each error, create a li element keyed to the error's inside
          and make err message as li content */}
          {errorList.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
      {/* shows single general error */}
      {error && <p className="error">{error}</p>}
      {/* renders submit button with appropriate label */}
      <button type="submit">{isLogin ? "Login" : "Register"}</button>
    </form>
  );
};

export default UserForm;
