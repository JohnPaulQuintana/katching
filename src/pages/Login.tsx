import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import qs from 'qs';
import { setToken, setName } from "../auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = qs.stringify({ username, password });
      const res = await axios.post("https://katching-backend.vercel.app/api/auth/login", data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setToken(res.data.access_token);
      setName(res.data.name)
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md space-y-6"
      >
        <h1 className="text-indigo-600 text-6xl text-center"><FontAwesomeIcon icon="coins"/></h1>

        <h2 className="text-2xl font-bold text-center uppercase text-gray-700">Welcome to Kaching</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Username Field */}
        <div className="relative">
          <FontAwesomeIcon
            icon="user"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Password Field with Toggle */}
        <div className="relative">
          <FontAwesomeIcon
            icon="lock"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            tabIndex={-1}
          >
            <FontAwesomeIcon icon={showPassword ? "eye-slash" : "eye"} />
          </button>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
