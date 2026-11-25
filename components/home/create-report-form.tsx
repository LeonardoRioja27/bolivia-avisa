"use client";
import ReportPhotoPicker from "@/components/report-photo-picker";
import { AuthorField, ConsentNote, HoneypotField } from "./form-fields";
import type { PublicationKind } from "./shared";

/** Igual que el límite del servidor (app/api/reports/route.ts). */
const TITLE_MAX = 120;

export default function CreateReportForm({
  kind,
  photo,
  onPhotoChange,
  onPhotoBusy,
  disabled,
  busy,
  onSubmit,
}: {
  /** Solo cambia los textos de ayuda; la categoría la decide Claude al publicar. */
  kind: PublicationKind;
  photo: string;
  onPhotoChange: (photo: string) => void;
  onPhotoBusy: (busy: boolean) => void;
  disabled: boolean;
  busy: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isNotice = kind === "Aviso";

  // Título y descripción son opcionales por separado, pero hace falta al menos uno.
  function requireOne(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const title = form.elements.namedItem("title") as HTMLInputElement;
    const body = form.elements.namedItem("body") as HTMLTextAreaElement;
    if (!title.value.trim() && !body.value.trim()) {
      e.preventDefault();
      title.setCustomValidity("Escribe un resumen o una descripción (al menos uno).");
      title.reportValidity();
      return;
    }
    onSubmit(e);
  }
  const clearValidity = (e: React.FormEvent<HTMLFieldSetElement>) =>
    (e.currentTarget.elements.namedItem("title") as HTMLInputElement).setCustomValidity("");
  return (
    <>
      <div className="eyebrow">TU COMUNIDAD TE ESCUCHA</div>
      <h2>{isNotice ? "Publicar un aviso" : kind}</h2>
      <p>
        Comparte hechos y evita datos personales. Clasificaremos tu aviso automáticamente. Este navegador recordará
        que el aviso es tuyo (con una cookie) para que puedas actualizarlo o retirarlo.
      </p>
      <form onSubmit={requireOne}>
        <HoneypotField />
        <AuthorField />
        <fieldset className="what" onInput={clearValidity}>
          <legend>
            {isNotice ? "¿Qué ocurre?" : "¿Qué objeto es?"} <span>Al menos uno.</span>
          </legend>
          <input
            name="title"
            aria-label="Resumen"
            maxLength={TITLE_MAX}
            placeholder={`Resumen. Máximo ${TITLE_MAX} caracteres`}
          />
          <textarea
            name="body"
            aria-label="Descripción"
            maxLength={2500}
            placeholder={
              isNotice
                ? "Qué has observado y desde cuándo. La IA te entiende y manda tu queja a la entidad correspondiente."
                : "Descripción: cómo es el objeto, cuándo y en qué zona se perdió o apareció."
            }
          />
        </fieldset>
        <label>
          Lugar
          <input
            name="location"
            maxLength={100}
            placeholder="Ciudad, barrio o parada. Si lo dejas vacío, la IA te entiende automáticamente."
          />
        </label>
        <ReportPhotoPicker value={photo} onChange={onPhotoChange} onBusy={onPhotoBusy} />
        <ConsentNote />
        <button disabled={disabled}>{busy ? "Publicando…" : "Publicar aviso"}</button>
      </form>
    </>
  );
}
