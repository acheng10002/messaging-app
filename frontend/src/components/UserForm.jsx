import { useState, useEffect } from "react";
// custom function to run client-side validation on the form data
import { validateUserForm } from "../validation/validateUserForm";
import { useAuth } from "../hooks/useAuth";

// mode prop determines whether this is a login or register form
const UserForm = ({ mode, onRegisterSuccess, onLoginSuccess }) => {
  // retrieves updater function for token and user
  const { setTokenAndUser } = useAuth();
  // isLogin is true if mode is login, false otherwise
  const isLogin = mode === "login";

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
      // API call that chooses the correct endpoint based on the mode
      const endpoint = isLogin
        ? `${import.meta.env.VITE_API_BASE_URL}/auth/login`
        : `${import.meta.env.VITE_API_BASE_URL}/users/register`;
      // creates the request payload
      const payload = isLogin
        ? // uses application/x-www-form-urlencoded if the mode is login
          new URLSearchParams({ username, password })
        : // uses a JSON string if the mode is register
          JSON.stringify({ name, username, password, passwordConfirmation });

      // sends the request to the backend with appropriate headers and body
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": isLogin
            ? "application/x-www-form-urlencoded"
            : "application/json",
        },
        body: payload,
      });

      // if the response isn/t ok, throws an error with the response text
      if (!res.ok) throw new Error(await res.text());

      // on success, parses the JSON response
      const data = await res.json();

      if (isLogin) {
        setTokenAndUser(data.token, data.user);
        onLoginSuccess(data.user);
      } else {
        // navigate("/auth/login");
        onRegisterSuccess();
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
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <br />
        </>
      )}
      {/* username and password are common to both login and register forms */}
      <label>
        Username:
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <br />

      <label>
        Password:
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <br />
      {/* if in registration mode, shows a field to confirm password */}
      {!isLogin && (
        <>
          <label>
            Confirm Password:
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
          </label>
          <br />
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
