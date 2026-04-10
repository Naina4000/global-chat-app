"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {

  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    profilePic: ""
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  /* ================= FETCH USER ================= */

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: "Bearer " + token
          }
        });

        const data = await res.json();
        setUser(data);

      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  /* ================= UPDATE ================= */

  const updateProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(user)
      });

      const data = await res.json();

      alert("Profile updated");

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-container">

      <h2>⚙️ Settings</h2>

      <div className="settings-card">

        <img
          src={user.profilePic || "https://i.pravatar.cc/100"}
          className="profile-img"
        />

        <input
          placeholder="Username"
          value={user.username}
          onChange={(e) =>
            setUser({ ...user, username: e.target.value })
          }
        />

        <input
          placeholder="Email"
          value={user.email}
          onChange={(e) =>
            setUser({ ...user, email: e.target.value })
          }
        />

        <input
          placeholder="Phone"
          value={user.phone}
          onChange={(e) =>
            setUser({ ...user, phone: e.target.value })
          }
        />

        <input
          placeholder="Profile Image URL"
          value={user.profilePic}
          onChange={(e) =>
            setUser({ ...user, profilePic: e.target.value })
          }
        />

        <button onClick={updateProfile}>
          Save Changes
        </button>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>

      </div>

    </div>
  );
}
