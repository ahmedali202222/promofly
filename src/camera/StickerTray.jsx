export default function StickerTray({ onAddEmoji, onAddLabel, onAddText }) {
  const labels = [
    { t: "SALE", bg: "#ef4444" },
    { t: "NEW", bg: "#3b82f6" },
    { t: "HOT", bg: "#f97316" },
    { t: "LIMITED", bg: "#a855f7" },
    { t: "FREE", bg: "#22c55e" },
    { t: "50% OFF", bg: "#ec4899" },
    { t: "BOGO", bg: "#6366f1" },
    { t: "TREND", bg: "#eab308" },
  ];
  const emojis = ["✨","🔥","💥","🎉","⭐","🛍️","💯","⚡"];

  return (
    <div className="w-full bg-black/60 backdrop-blur-xl text-white rounded-2xl p-3">
      <div className="flex flex-wrap gap-2 mb-3">
        {labels.map((l) => (
          <button key={l.t}
            onClick={() => onAddLabel(l.t, l.bg)}
            className="px-3 py-1.5 rounded-xl font-bold"
            style={{ background: l.bg }}
          >
            {l.t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {emojis.map((e) => (
          <button key={e}
            onClick={() => onAddEmoji(e)}
            className="px-3 py-2 rounded-xl bg-white/10 text-2xl">
            {e}
          </button>
        ))}
      </div>
      <div>
        <button
          onClick={() => {
            const t = prompt("Enter text");
            if (t) onAddText(t);
          }}
          className="px-3 py-2 rounded-xl bg-white text-black font-semibold"
        >
          + Add Text
        </button>
      </div>
    </div>
  );
}