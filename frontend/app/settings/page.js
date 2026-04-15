"use client";
import "./settings.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {

  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    profilePic: ""
  });

  const userInfo =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

const token = userInfo?.token;

  /* ================= PROTECT ROUTE ================= */

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");

    if (!userInfo) {
      router.push("/login");
    }
  }, []);

  /* ================= FETCH USER ================= */

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: "Bearer " + token
          }
        });

        if (!res.ok) {
          console.error("Fetch user failed:", res.status);
          return;
        }

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

      if (!res.ok) {
        console.error("Update failed:", res.status);
        return;
      }

      await res.json();

      alert("Profile updated");
      setIsEditing(false); // ✅ exit edit mode

    } catch (err) {
      console.error(err);
    }
  };

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };
  

  return (
    <div className="settings-container">
      <div className="back-button" onClick={() => router.push("/chat")}>
        ← 
        </div>
      <div className="settings-card">

        <h2 className="settings-title">⚙️ Settings</h2>

        {/* PROFILE IMAGE */}
        <img
          src={user.profilePic || "https://i.pravatar.cc/100"}
          className="profile-img"
        />

        {/* USERNAME */}
        <div className="input-group">
          <label>Username</label>
          <input
            disabled={!isEditing}
            value={user.username}
            onChange={(e) =>
              setUser({ ...user, username: e.target.value })
            }
          />
        </div>

        {/* EMAIL */}
        <div className="input-group">
          <label>Email</label>
          <input
            disabled={!isEditing}
            value={user.email}
            onChange={(e) =>
              setUser({ ...user, email: e.target.value })
            }
          />
        </div>

        {/* PHONE */}
        <div className="input-group">
          <label>Phone</label>
          <input
            disabled={!isEditing}
            value={user.phone}
            onChange={(e) =>
              setUser({ ...user, phone: e.target.value })
            }
          />
        </div>

        {/* PROFILE PIC */}
        <div className="input-group">
          <label>Profile Image URL</label>
          <input
            disabled={!isEditing}
            value={user.profilePic}
            onChange={(e) =>
              setUser({ ...user, profilePic: e.target.value })
            }
          />
        </div>

        {/* BUTTONS */}
        <div className="button-group">

          {!isEditing ? (
            <button
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <button
              className="save-btn"
              onClick={updateProfile}
            >
              Save Changes
            </button>
          )}

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}
