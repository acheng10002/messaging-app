/* top-level component wrapoing entire app 
contains global routing and layout */
/* Routes - parent warapper for all route definitions 
Route - individual route and route hierarchies */
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";

const App = () => {
  const navigate = useNavigate();
  return (
    <Routes>
      {/* layout route wraps child routes in a shared layout containing just Header */}
      <Route element={<AuthLayout />}>
        {/* two child routes */}
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
        <Route path="/users/:userid/chats" element={<ChatPanel />} />
        <Route path="/users/:userid/chats/:chatid" element={<ChatView />} />
      </Route>
    </Routes>
  );
};

export default App;
