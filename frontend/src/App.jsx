/* top-level component wrapoing entire app 
contains global routing and layout */
/* Routes - parent warapper for all route definitions 
Route - individual route and route hierarchies */
import { Routes, Route, useNavigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";

import UserForm from "./components/UserForm";
import ChatsPanel from "./components/ChatsPanel";
import ChatView from "./components/ChatView";
// import { useAuth } from "./hooks/useAuth";

import "./styles/App.css";

const App = () => {
  const navigate = useNavigate();
  // const { user } = useAuth;

  return (
    <Routes>
      {/* layout route wraps child routes in a shared layout containing just Header */}
      <Route element={<AuthLayout />}>
        {/* two child routes */}
        <Route path="/" element={<UserForm mode="new-user" />} />
        <Route
          path="/users/register"
          element={
            <UserForm
              mode="register"
              onRegisterSuccess={() => navigate("/auth/login")}
            />
          }
        />
        <Route
          path="/auth/login"
          element={
            <UserForm
              mode="login"
              onLoginSuccess={(user) => navigate(`/users/${user.id}/chats`)}
            />
          }
        />
      </Route>
      {/* layout route wraps child routes in a shared layout containing Header and Sidebar */}
      <Route element={<MainLayout />}>
        {/* two child routes */}
        <Route path="/users/:userid/chats" element={<ChatsPanel />} />
        <Route path="/users/:userid/chats/:chatid" element={<ChatView />} />
      </Route>
    </Routes>
  );
};

export default App;
