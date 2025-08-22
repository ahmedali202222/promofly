// src/components/AdminApproveQueue.jsx
import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AdminApproveQueue({ promoId }) {
  const db = getFirestore();
  const [promo, setPromo] = useState(null);
  const [targets, setTargets] = useState({ instagram: true, facebook: true, tiktok: false, x: false });
  const [cap, setCap] = useState({ ig: "", fb: "", tiktok: "", x: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "promos", promoId));
      const data = snap.data();
      setPromo(data);
      const base =
        (data?.caption || "") +
        (data?.hashtags?.length ? " " + data.hashtags.map((h) => "#" + h).join(" ") : "");
      setCap({ ig: base, fb: base, tiktok: base, x: base.slice(0, 260) });
    })();
  }, [promoId]);

  const queue = async () => {
    if (!promo) return;
    setBusy(true);
    try {
      await addDoc(collection(db, "socialQueue"), {
        promoId,
        ownerUid: promo.ownerUid,
        targets,
        captionBundle: cap,
        asset: {
          mp4Portrait1080: promo.portrait1080,
          thumb: promo.media?.[0]?.thumb,
        },
        status: "queued",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert("Queued!");
    } finally {
      setBusy(false);
    }
  };

  if (!promo) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 border rounded-2xl space-y-4">
      <h2 className="text-lg font-semibold">Approve & Queue</h2>

      {/* If you use Firebase Hosting rewrite, this gs:// redirect works; otherwise show a note */}
      <video
        className="w-full max-h-96 rounded"
        controls
        src={promo.portrait1080?.replace(/^gs:\/\//, "/__/storage/redirect/")}
      />

      <div className="grid grid-cols-2 gap-4">
        {["instagram", "facebook", "tiktok", "x"].map((k) => (
          <label key={k} className="flex items-center gap-2 border rounded p-2">
            <input
              type="checkbox"
              checked={targets[k]}
              onChange={(e) => setTargets((t) => ({ ...t, [k]: e.target.checked }))}
            />
            <span className="capitalize">{k}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-3">
        <textarea className="border rounded p-2" rows={3} value={cap.ig}
          onChange={(e) => setCap({ ...cap, ig: e.target.value })} placeholder="Instagram caption" />
        <textarea className="border rounded p-2" rows={3} value={cap.fb}
          onChange={(e) => setCap({ ...cap, fb: e.target.value })} placeholder="Facebook caption" />
        <textarea className="border rounded p-2" rows={3} value={cap.tiktok}
          onChange={(e) => setCap({ ...cap, tiktok: e.target.value })} placeholder="TikTok caption" />
        <textarea className="border rounded p-2" rows={3} value={cap.x}
          onChange={(e) => setCap({ ...cap, x: e.target.value })} placeholder="X caption" />
      </div>

      <button disabled={busy} onClick={queue} className="bg-black text-white px-4 py-2 rounded">
        {busy ? "Queuing…" : "Queue for Publishing"}
      </button>
    </div>
  );
}
