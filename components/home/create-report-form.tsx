"use client";
import ReportPhotoPicker from "@/components/report-photo-picker";
import { AuthorField, ConsentNote, HoneypotField } from "./form-fields";
import type { PublicationKind } from "./shared";

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
  return (
    <>
      <div className="eyebrow">TU COMUNIDAD TE ESCUCHA</div>
      <h2>{isNotice ? "Publicar un aviso" : kind}</h2>
      <p>
        Comparte hechos y evita datos personales. Clasificaremos tu aviso automáticamente. Este navegador recordará
        que el aviso es tuyo (con una cookie) para que puedas actualizarlo o retirarlo.
      </p>
      <form onSubmit={onSubmit}>
        <HoneypotField />
        <AuthorField />
        <label>
          {isNotice ? "¿Qué ocurre?" : "¿Qué objeto es?"}
          <input
            name="title"
            required
            maxLength={120}
            placeholder={isNotice ? "Ej.: Hay un problema con el tren 33" : "Ej.: Mochila azul perdida en el centro"}
          />
        </label>
        <label>
          Lugar
          <input name="location" required maxLength={100} placeholder="Ciudad, barrio o parada" />
        </label>
        <label>
          Descripción
          <textarea
            name="body"
            required
            maxLength={2500}
            placeholder={
              isNotice
                ? "Qué has observado y desde cuándo…"
                : "Describe el objeto, cuándo y en qué zona se perdió o apareció."
            }
          />
        </label>
        <ReportPhotoPicker value={photo} onChange={onPhotoChange} onBusy={onPhotoBusy} />
        <ConsentNote />
        <button disabled={disabled}>{busy ? "Publicando…" : "Publicar aviso"}</button>
      </form>
    </>
  );
}
