import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

/** Maintain elements in a 1080x1920 internal space for clean export */
const W = 1080, H = 1920;

function toScreen(val, scale) { return val * scale; }
function toWorld(val, scale) { return val / scale; }

const StickerCanvas = forwardRef(function StickerCanvas({ className = "" }, ref) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);   // world->screen scale
  const [els, setEls] = useState([]);      // {id,type,text/emoji,bg,x,y,scale,rot,color}

  // public API
  useImperativeHandle(ref, () => ({
    get els() { return els; }, // Expose els array for external access
    addEmoji(emoji) {
      setEls((p) => p.concat({
        id: crypto.randomUUID(),
        type: "emoji",
        emoji,
        x: W/2, y: H/2, scale: 1, rot: 0
      }));
    },
    addLabel(label, bg = "#111", color = "#fff") {
      setEls((p) => p.concat({
        id: crypto.randomUUID(),
        type: "label",
        text: label, bg, color,
        x: W/2, y: H/2, scale: 1, rot: 0
      }));
    },
    addText(text, color = "#fff") {
      setEls((p) => p.concat({
        id: crypto.randomUUID(),
        type: "text",
        text, color,
        x: W/2, y: H/2, scale: 1, rot: 0
      }));
    },
    async exportPNG(canvas) {
      // canvas already has the video frame drawn (object-cover style)
      const ctx = canvas.getContext("2d");
      
      // draw stickers on top of the existing canvas
      els.forEach((e) => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate((e.rot * Math.PI) / 180);
        const sc = e.scale;
        if (e.type === "emoji") {
          ctx.font = `${Math.round(120 * sc)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(e.emoji, 0, 0);
        } else if (e.type === "label") {
          const pad = 16 * sc;
          ctx.font = `700 ${Math.round(42 * sc)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
          const textW = ctx.measureText(e.text).width;
          const boxW = textW + pad * 2;
          const boxH = 60 * sc + pad;
          ctx.fillStyle = e.bg || "#111";
          roundRect(ctx, -boxW/2, -boxH/2, boxW, boxH, 14 * sc);
          ctx.fill();
          ctx.fillStyle = e.color || "#fff";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(e.text, 0, 2 * sc);
        } else if (e.type === "text") {
          ctx.font = `700 ${Math.round(54 * sc)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
          ctx.fillStyle = e.color || "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(e.text, 0, 0);
        }
        ctx.restore();
      });
      
      // Return the modified canvas (no need to create new blob here)
      return canvas;
    }
  }));

  // track container size to compute scale (fit 9:16 inside)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const s = Math.min(el.clientWidth / W, el.clientHeight / H);
      setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // basic drag/rotate/scale with pointer
  const dragging = useRef(null); // {id, startX, startY, origX, origY}
  const onPointerDown = (e, id) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = toWorld(e.clientX - rect.left, scale);
    const y = toWorld(e.clientY - rect.top, scale);
    const el = els.find((t) => t.id === id);
    dragging.current = { id, dx: x - el.x, dy: y - el.y };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  const onPointerMove = (e) => {
    const d = dragging.current; if (!d) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = toWorld(e.clientX - rect.left, scale);
    const y = toWorld(e.clientY - rect.top, scale);
    setEls((p) => p.map((t) => (t.id === d.id ? { ...t, x: x - d.dx, y: y - d.dy } : t)));
  };
  const onPointerUp = () => {
    dragging.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  const nudgeScale = (id, k) => setEls((p) => p.map((t) => (t.id === id ? { ...t, scale: Math.max(0.3, Math.min(4, t.scale + k)) } : t)));
  const nudgeRotate = (id, k) => setEls((p) => p.map((t) => (t.id === id ? { ...t, rot: (t.rot + k) % 360 } : t)));
  const removeEl = (id) => setEls((p) => p.filter((t) => t.id !== id));

  return (
    <div ref={containerRef} className={`relative w-full aspect-[9/16] ${className}`}>
      {/* draw each element as DOM for interactivity */}
      {els.map((e) => (
        <div
          key={e.id}
          onPointerDown={(ev) => onPointerDown(ev, e.id)}
          className="absolute select-none cursor-grab active:cursor-grabbing"
          style={{
            left: toScreen(e.x, scale),
            top: toScreen(e.y, scale),
            transform: `translate(-50%,-50%) rotate(${e.rot}deg) scale(${e.scale})`,
            transformOrigin: "center",
          }}
        >
          {e.type === "emoji" && (
            <div className="text-[120px] leading-none">{e.emoji}</div>
          )}
          {e.type === "label" && (
            <div className="px-4 py-2 rounded-2xl font-bold text-white"
                 style={{ background: e.bg, color: e.color, fontSize: 42 }}>
              {e.text}
            </div>
          )}
          {e.type === "text" && (
            <div className="font-extrabold" style={{ color: e.color, fontSize: 54 }}>
              {e.text}
            </div>
          )}

          {/* tiny handles */}
          <div className="absolute -right-6 -top-6 flex gap-1">
            <button onClick={(ev)=>{ev.stopPropagation(); nudgeScale(e.id, +0.1);}}
                    className="w-7 h-7 rounded-full bg-black/60 text-white text-xs">＋</button>
            <button onClick={(ev)=>{ev.stopPropagation(); nudgeScale(e.id, -0.1);}}
                    className="w-7 h-7 rounded-full bg-black/60 text-white text-xs">－</button>
            <button onClick={(ev)=>{ev.stopPropagation(); nudgeRotate(e.id, +10);}}
                    className="w-7 h-7 rounded-full bg-black/60 text-white text-xs">⟳</button>
            <button onClick={(ev)=>{ev.stopPropagation(); removeEl(e.id);}}
                    className="w-7 h-7 rounded-full bg-black/60 text-white text-xs">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
});

export default StickerCanvas;

// utils
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}