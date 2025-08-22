import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase";

export default function SanityUploadButton() {
  const [busy, setBusy] = useState(false);
  if (!import.meta.env.DEV) return null; // hides in production

  const run = async () => {
    try {
      setBusy(true);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        alert("Please sign in first so rules allow the write.");
        return;
      }
      const blob = new Blob(["hello from Promofly"], { type: "text/plain" });
      const path = `promos/${uid}/sanity-${Date.now()}.txt`; // matches your rules
      const r = ref(storage, path);
      await uploadBytes(r, blob);
      const url = await getDownloadURL(r);
      console.log("Sanity OK:", path, url);
      alert(`Sanity upload OK!\n\nPath: ${path}\nCheck the console for URL.`);
    } catch (e) {
      console.error("Sanity upload failed:", e);
      alert(`Sanity upload failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={busy}
      className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400"
    >
      {busy ? "Uploading…" : "Run Sanity Upload"}
    </button>
  );
}
