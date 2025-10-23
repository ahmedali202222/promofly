import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const signIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const auth = getAuth();
      const { user } = await signInWithEmailAndPassword(auth, email, pass);
      const ok = ADMIN_EMAILS.includes((user?.email || "").toLowerCase());
      if (!ok) throw new Error("Not authorized for admin.");
      navigate("/admin");
    } catch (err) {
      setError(err?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <form onSubmit={signIn} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Admin Sign In</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input className="w-full border rounded-lg p-3" type="email" placeholder="Admin email"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded-lg p-3" type="password" placeholder="Password"
               value={pass} onChange={e=>setPass(e.target.value)} />
        <button className="w-full bg-black text-white rounded-lg py-3 font-semibold">Sign In</button>
      </form>
    </div>
  );
}
