"use client"

import { useState } from "react"
import axios from "axios"

export default function Home() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {

    try {

      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password
      })

      console.log(res.data)

      alert("Login successful!")

      localStorage.setItem("token", res.data.token)

    } catch (error) {
      alert("Login failed")
    }

  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">

      <div className="bg-white p-6 rounded shadow-md w-80">

        <h2 className="text-xl font-bold mb-4 text-center">
          Chat Login
        </h2>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white w-full p-2 rounded"
          onClick={handleLogin}
        >
          Login
        </button>

      </div>

    </div>
  )
}