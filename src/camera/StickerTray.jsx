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
    <div className="w-full bg-black/60 backdrop-blur-xl text-white rounded-xl p-2">
      <div className="flex flex-wrap gap-1 mb-2">
        {labels.map((l) => (
          <button key={l.t}
            onClick={() => onAddLabel(l.t, l.bg)}
            className="px-2 py-1 rounded-lg font-bold text-xs"
            style={{ background: l.bg }}
          >
            {l.t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {emojis.map((e) => (
          <button key={e}
            onClick={() => onAddEmoji(e)}
            className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-sm hover:bg-white/20">
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
          className="px-2 py-1 rounded-lg bg-white text-black font-semibold text-xs"
        >
          + Text
        </button>
      </div>
    </div>
  );
}