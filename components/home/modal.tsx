"use client";

/** Capa oscura + ventana. Se cierra con la ×, o al pulsar fuera de la ventana. */
export default function Modal({
  label,
  notice,
  onClose,
  children,
}: {
  label: string;
  notice: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-label={label}>
        <button className="close" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        {children}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
