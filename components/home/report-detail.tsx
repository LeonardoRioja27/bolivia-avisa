"use client";
import { ConsentCheckbox, HoneypotField } from "./form-fields";
import {
  formatDate,
  readKey,
  statuses,
  type Comment,
  type ModerateAction,
  type Report,
  type SubmitAction,
} from "./shared";

/** Contenido del modal al abrir un aviso: detalle, conversación y acciones. */
export default function ReportDetail({
  report,
  comments,
  signedIn,
  moderator,
  disabled,
  onSubmit,
  onModerate,
}: {
  report: Report;
  comments: Comment[];
  signedIn: boolean;
  moderator: boolean;
  disabled: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, action: SubmitAction) => void;
  onModerate: (action: ModerateAction, id: string, kind: "report" | "comment") => void;
}) {
  const statusClass = "badge s" + statuses.indexOf(report.status);
  return (
    <>
      <span className={statusClass}>{report.status}</span>
      <h2>{report.title}</h2>
      <p className="meta">
        {report.location} · {report.category} · {report.author} · {formatDate(report.created)}
      </p>
      <p className="report-body">{report.body}</p>
      {report.imageUrl && (
        <a href={report.imageUrl} target="_blank" rel="noreferrer" aria-label="Abrir foto del objeto en tamaño completo">
          <img className="object-photo detail-photo" src={report.imageUrl} alt={"Foto del objeto: " + report.title} />
        </a>
      )}

      <h3>Conversación</h3>
      <div className="conversation">
        {comments.map((c) => (
          <article key={c.id}>
            <b>{c.author}</b>
            <small>{formatDate(c.created)}</small>
            <p>{c.body}</p>
            <button className="text-button" disabled={!signedIn} onClick={() => onModerate("flag", c.id, "comment")}>
              Denunciar comentario
            </button>
            {(moderator || c.canManage || !!readKey(c.id)) && (
              <button className="text-button" onClick={() => onModerate("hide", c.id, "comment")}>
                Retirar comentario
              </button>
            )}
          </article>
        ))}
        {!comments.length && <p>Aún no hay comentarios. ¿Tienes alguna novedad?</p>}
      </div>

      <form onSubmit={(e) => onSubmit(e, "comment")}>
        <HoneypotField />
        <label>
          Tu nombre o alias
          <input name="author" required maxLength={50} />
        </label>
        <label>
          Añadir un comentario
          <textarea name="body" required maxLength={2500} placeholder="Comparte lo que sabes…" />
        </label>
        <ConsentCheckbox />
        <button disabled={disabled}>Enviar comentario</button>
      </form>

      {report.canManage && (
        <details>
          <summary>Actualizar el estado</summary>
          <form onSubmit={(e) => onSubmit(e, "status")}>
            <HoneypotField />
            <label>
              Tu nombre o alias
              <input name="author" required maxLength={50} />
            </label>
            <label>
              Nuevo estado
              <select name="status" defaultValue={report.status}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "Resuelto" && report.category.startsWith("Objetos ") ? "Resuelto · devuelto o recuperado" : s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Explica qué ha cambiado
              <textarea name="body" required maxLength={2500} />
            </label>
            <ConsentCheckbox />
            <button disabled={disabled}>Guardar actualización</button>
          </form>
        </details>
      )}

      <div className="moderation-actions">
        <button onClick={() => onModerate("flag", report.id, "report")} disabled={!signedIn}>
          Denunciar aviso
        </button>
        {report.canManage && <button onClick={() => onModerate("hide", report.id, "report")}>Retirar aviso</button>}
      </div>
    </>
  );
}
