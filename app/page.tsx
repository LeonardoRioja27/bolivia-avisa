"use client";
import { useEffect, useState } from "react";
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
const REFRESH_MS = 30_000;

export default function Home() {
  // Datos que llegan de /api/reports
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [challenge, setChallenge] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [moderator, setModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado del modal
  const [selected, setSelected] = useState<string | null>(null);
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
      setChallenge((previous) =>
        previous && Date.now() - Number(previous.split(".")[0]) < CHALLENGE_REUSE_MS ? previous : x.challenge,
      );
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

  function changeKind(kind: PublicationKind) {
    setPublicationKind(kind);
    setPhoto("");
    setPhotoBusy(false);
  }

  function openCreate(kind: PublicationKind = "Aviso") {
    setSelected(null);
    changeKind(kind);
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

  async function moderate(action: ModerateAction, id: string, kind: string) {
    const reason = action === "flag" ? window.prompt("¿Por qué quieres denunciar este contenido?") : "";
    if (action === "flag" && !reason) return;
    if (action === "hide" && !window.confirm("¿Retirar este contenido de la web?")) return;
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, kind, reason, challenge, ownerToken: readKey(id) }),
      });
      const x = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(x.error);
      setSelected(null);
      await load();
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
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          action,
          id: selected,
          ownerToken: legacyKey || undefined,
          challenge,
          photo: action === "create" && publicationKind !== "Aviso" ? photo : undefined,
        }),
      });
      const x = (await r.json()) as { error: string };
      if (!r.ok) throw Error(x.error);
      if (action === "create") setCreate(false);
      form.reset();
      setNotice("Guardado. Gracias por aportar a la comunidad.");
      await load();
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
              onKindChange={changeKind}
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
