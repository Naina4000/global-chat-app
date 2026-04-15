"use client";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css"; // ✅ IMPORT CSS

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  
useEffect(() => {
  const user = localStorage.getItem("userInfo");

  if (user) {
    router.push("/chat");
  }
}, []);
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      console.log("Login clicked");

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

      if (data.token) {
        localStorage.setItem("userInfo", JSON.stringify(data));

        console.log("Saved:", localStorage.getItem("userInfo"));

        alert("Login successful");

        router.push("/chat");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="login-container">
      <form
        className="login-box"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(e);
        }}
      >
        <h2 className="login-title">Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />

        <button type="submit" className="login-btn">
          Login
        </button>
      </form>
    </div>
  );
}
