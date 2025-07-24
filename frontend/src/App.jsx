/* top-level component wrapping entire app 
- contains global routing and layout */
/* Routes - parent wrapper for all route definitions 
Route - individual route and route hierarchies 
useNavigate - hook that redirects user to a url */
import { Routes, Route, useNavigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";

import UserForm from "./components/UserForm/UserForm";
import ChatsPanel from "./components/ChatsPanel/ChatsPanel";
import ChatView from "./components/ChatView/ChatView";

import "./styles/App.css";

const App = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* layout route wraps child routes in a shared layout containing Header etc. */}
      <Route element={<AuthLayout />}>
        {/* 3 child routes 
         - new-user tells user to register or log in */}
        <Route path="/" element={<UserForm mode="new-user" />} />
        <Route
          path="/users/register"
          element={
            <UserForm
              mode="register"
              /* {() => } inline arrow function passed as a deferred callback prop 
                 that is defined immediately but executed later 
              - takes registered user to login page */
              onRegisterSuccess={() => navigate("/auth/login")}
            />
          }
        />
        <Route
          path="/auth/login"
          element={
            <UserForm
              mode="login"
              // takes logged-in user to their chats
              onLoginSuccess={(user) => navigate(`/users/${user.id}/chats`)}
            />
          }
        />
      </Route>
      {/* layout route wraps child routes in a shared layout containing Header, Sidebar, etc. */}
      <Route element={<MainLayout />}>
        {/* two child routes 
        - chat summaries of all a logged-in user's chats */}
        <Route path="/users/:userid/chats" element={<ChatsPanel />} />
        {/* individual full chat */}
        <Route path="/users/:userid/chats/:chatid" element={<ChatView />} />
      </Route>
    </Routes>
  );
};

export default App;
