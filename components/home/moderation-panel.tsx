import type { Flag } from "./shared";

export default function ModerationPanel({ flags, onHide }: { flags: Flag[]; onHide: (flag: Flag) => void }) {
  return (
    <section className="moderation">
      <h2>Moderación</h2>
      <p>Revisa las denuncias antes de retirar contenido. Los avisos antiguos sin propietario solo los gestiona moderación.</p>
      {flags.length ? (
        flags.map((f) => (
          <article key={f.id}>
            <p>{f.reason}</p>
            <small>
              {f.kind} · {f.targetId}
            </small>
            <button onClick={() => onHide(f)}>Retirar contenido denunciado</button>
          </article>
        ))
      ) : (
        <p>No hay denuncias.</p>
      )}
    </section>
  );
}
