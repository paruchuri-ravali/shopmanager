import type { ReactNode } from 'react';

export default function Modal({
  title,
  onClose,
  children,
  wide
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-panel card ${wide ? 'modal-panel-wide' : ''}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="button-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
