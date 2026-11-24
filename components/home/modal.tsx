"use client";

/**
 * Capa oscura + ventana. Solo se cierra con la ×: pulsar fuera no la cierra,
 * para no perder lo que se está escribiendo.
 */
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
    <div className="overlay">
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
