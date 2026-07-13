import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ token });
    }
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError("");

      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const token = response.data.access_token;

      localStorage.setItem("token", token);

setUser({
  full_name: "Admin User",
  email,
  token,
});

      return true;
    } catch (err) {
      console.error(err);

      const detail = err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Login failed");
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Invalid username or password");
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (fullName, email, password) => {
    try {
      setLoading(true);
      setError("");

      await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
      });

      return await signIn(email, password);
    } catch (err) {
      console.error(err);

      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Registration failed");
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

return (
  <AuthContext.Provider
    value={{
      user,
      isAdmin: true,
      loading,
      error,
      signIn,
      signUp,
      signOut,
    }}
  >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);