"use client";
import { useEffect, useRef, useState } from "react";
import CreateReportForm from "@/components/home/create-report-form";
import Hero from "@/components/home/hero";
import HowItWorks from "@/components/home/how-it-works";
import Modal from "@/components/home/modal";
import ModerationPanel from "@/components/home/moderation-panel";
import ReportDetail from "@/components/home/report-detail";
import ReportsSection from "@/components/home/reports-section";
import SiteFooter from "@/components/home/site-footer";
import SiteHeader from "@/components/home/site-header";
import Stats from "@/components/home/stats";
import {
  readKey,
  type Comment,
  type Flag,
  type ModerateAction,
  type PublicationKind,
  type Report,
  type SubmitAction,
} from "@/components/home/shared";
import { powPayload, solvePow } from "@/lib/pow";

type ApiResponse = {
  error: string;
  reports: Report[];
  comments: Comment[];
  signedIn: boolean;
  moderator: boolean;
  challenge: string;
  flags: Flag[];
};

/** Un challenge dura 1 h en el servidor; lo renovamos a los 30 min. */
const CHALLENGE_REUSE_MS = 1_800_000;
/** El servidor rechaza challenges con menos de 2 s de antigüedad. */
const CHALLENGE_MIN_AGE_MS = 2_200;
const REFRESH_MS = 30_000;

export default function Home() {
  // Datos que llegan de /api/reports
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  // Cada challenge vale para un solo envío; se guarda con la hora en que llegó.
  const challenge = useRef({ token: "", receivedAt: 0 });
  const [signedIn, setSignedIn] = useState(false);
  const [moderator, setModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado del modal
  // Enlace directo a un aviso (?aviso=<id>), por ejemplo desde el correo que recibe una entidad.
  // El modal solo aparece cuando llegan los avisos, así que no afecta al HTML del servidor.
  const [selected, setSelected] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("aviso"),
  );
  const [create, setCreate] = useState(false);
  const [publicationKind, setPublicationKind] = useState<PublicationKind>("Aviso");
  const [photo, setPhoto] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const current = reports.find((r) => r.id === selected);
  const formDisabled = busy || photoBusy || !signedIn;

  async function load() {
    try {
      const r = await fetch("/api/reports");
      const x = (await r.json()) as ApiResponse;
      if (!r.ok) throw Error(x.error);
      if (!challenge.current.token || Date.now() - challenge.current.receivedAt > CHALLENGE_REUSE_MS) {
        challenge.current = { token: x.challenge, receivedAt: Date.now() };
      }
      setSignedIn(x.signedIn);
      setModerator(x.moderator);
      setFlags(x.flags);
      setReports(
        x.reports.map((r) => {
          const legacy = !!readKey(r.id);
          return { ...r, canManage: r.canManage || legacy, mine: r.mine || legacy };
        }),
      );
      setComments(x.comments);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  function openCreate(kind: PublicationKind = "Aviso") {
    setSelected(null);
    setPublicationKind(kind);
    setPhoto("");
    setPhotoBusy(false);
    setNotice("");
    setCreate(true);
  }

  function openReport(id: string) {
    setSelected(id);
    setNotice("");
  }

  function closeModal() {
    setCreate(false);
    setSelected(null);
  }

  /**
   * Envía una acción a la API con la prueba de trabajo antispam: espera a que
   * el challenge tenga 2 s, calcula el nonce sobre el contenido y gasta el
   * challenge (después se pide uno nuevo).
   */
  async function post(data: Record<string, unknown>) {
    const { token, receivedAt } = challenge.current;
    if (!token) throw Error("No se pudo preparar el envío. Recarga la página.");
    const wait = CHALLENGE_MIN_AGE_MS - (Date.now() - receivedAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    const pow = await solvePow(token, powPayload(data));
    challenge.current = { token: "", receivedAt: 0 };
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, challenge: token, pow }),
      });
      const x = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(x.error);
    } finally {
      await load(); // trae los datos nuevos y un challenge sin usar
    }
  }

  async function moderate(action: ModerateAction, id: string, kind: string) {
    const reason = action === "flag" ? window.prompt("¿Por qué quieres denunciar este contenido?") : "";
    if (action === "flag" && !reason) return;
    if (action === "hide" && !window.confirm("¿Retirar este contenido de la web?")) return;
    try {
      await post({ action, id, kind, reason, ownerToken: readKey(id) });
      setSelected(null);
      window.alert(action === "flag" ? "Denuncia enviada a moderación." : "Contenido retirado.");
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>, action: SubmitAction) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setNotice("");
    try {
      const values = Object.fromEntries(new FormData(form));
      // La autoría la recuerda la cookie del servidor; ownerToken solo sirve
      // para avisos antiguos cuya clave quedó en localStorage.
      const legacyKey = action === "status" ? readKey(selected || "") : "";
      await post({
        ...values,
        action,
        id: selected,
        ownerToken: legacyKey || undefined,
        photo: action === "create" && photo ? photo : undefined,
        // Pista para la clasificación automática: qué botón abrió el formulario.
        hint: action === "create" && publicationKind !== "Aviso" ? publicationKind : undefined,
      });
      if (action === "create") setCreate(false);
      form.reset();
      setNotice("Guardado. Gracias por aportar a la comunidad.");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader onPublish={() => openCreate()} />
      <main>
        <p className="signin-note">
          Prueba comunitaria abierta · Participa con un alias, sin crear una cuenta. Los alias no verifican la identidad
          de las personas.
        </p>
        <Hero onPublish={() => openCreate()} />
        <Stats reports={reports} />
        <ReportsSection
          reports={reports}
          comments={comments}
          loading={loading}
          error={error}
          onRetry={load}
          onPublish={openCreate}
          onSelect={openReport}
        />
        {moderator && <ModerationPanel flags={flags} onHide={(f) => moderate("hide", f.targetId, f.kind)} />}
        <HowItWorks />
      </main>
      <SiteFooter />

      {(create || current) && (
        <Modal label={create ? "Publicar un aviso" : (current?.title ?? "")} notice={notice} onClose={closeModal}>
          {create ? (
            <CreateReportForm
              kind={publicationKind}
              photo={photo}
              onPhotoChange={setPhoto}
              onPhotoBusy={setPhotoBusy}
              disabled={formDisabled}
              busy={busy}
              onSubmit={(e) => submit(e, "create")}
            />
          ) : (
            current && (
              <ReportDetail
                report={current}
                comments={comments.filter((c) => c.reportId === current.id)}
                signedIn={signedIn}
                moderator={moderator}
                disabled={formDisabled}
                onSubmit={submit}
                onModerate={moderate}
              />
            )
          )}
        </Modal>
      )}
    </>
  );
}
