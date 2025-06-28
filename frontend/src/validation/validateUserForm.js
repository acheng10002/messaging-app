/* frontend validation that runs in the browser before making API calls 
prevents invalid data from being submitted to the server */
export const validateUserForm = ({
  name,
  email,
  username,
  password,
  passwordConfirmation,
  isLogin,
}) => {
  const errors = [];

  if (!username.trim()) {
    errors.push("Username is required.");
  }

  if (email !== undefined) {
    if (!email.trim()) {
      errors.push("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format.");
    }
  }

  if (!password) {
    errors.push("Password is required.");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters.");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter.");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter.");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number.");
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push("Password must contain at least one special character.");
    }
  }

  if (!isLogin) {
    if (!name.trim()) {
      errors.push("Name is required.");
    }
    if (password !== passwordConfirmation) {
      errors.push("Passwords do not match.");
    }
  }

  return errors;
};
