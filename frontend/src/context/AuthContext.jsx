import { createContext, useContext, useState, useCallback } from "react";
import * as endpoints from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await endpoints.login(email, password);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err?.response?.data?.detail || "Invalid email or password");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (fullName, email, password) => {
    setLoading(true);
    setError("");
    try {
      await endpoints.register(fullName, email, password);
      return await signIn(email, password);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not create account");
      return false;
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  const signOut = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, error, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
