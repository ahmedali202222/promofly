export default function Modal({ open, onClose, children }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 grid place-items-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-4 w-[95vw] max-w-[480px]">
          {children}
        </div>
      </div>
    );
  }
  