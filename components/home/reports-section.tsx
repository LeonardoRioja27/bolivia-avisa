"use client";
import { useState } from "react";
import ReportCard from "./report-card";
import { categories, statuses, type Comment, type PublicationKind, type Report } from "./shared";

const sections = ["Todos", "Objetos perdidos", "Objetos encontrados"];

/** «¿Qué está pasando?»: buscador, filtros y cuadrícula de avisos. */
export default function ReportsSection({
  reports,
  comments,
  loading,
  error,
  onRetry,
  onPublish,
  onSelect,
}: {
  reports: Report[];
  comments: Comment[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onPublish: (kind?: PublicationKind) => void;
  onSelect: (id: string) => void;
}) {
  const [section, setSection] = useState("Todos");
  const [filter, setFilter] = useState("Todos");
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");

  const visible = reports.filter(
    (r) =>
      (section === "Todos" || r.category === section) &&
      (filter === "Todos" || r.status === filter) &&
      (category === "Todas" || r.category === category) &&
      (r.title + " " + r.body + " " + r.location).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section id="avisos">
      <div className="section-top">
        <div>
          <div className="eyebrow">EL PULSO DE LA COMUNIDAD</div>
          <h2>¿Qué está pasando?</h2>
        </div>
        <label className="search">
          ⌕{" "}
          <input
            aria-label="Buscar avisos"
            placeholder="Buscar un objeto, problema o lugar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="object-section">
        <div>
          <h3>¿Perdiste o encontraste algo?</h3>
          <p>Comparte una foto y ayuda a que vuelva a su dueño.</p>
        </div>
        <button onClick={() => onPublish("He perdido algo")}>He perdido algo</button>
        <button onClick={() => onPublish("He encontrado algo")}>He encontrado algo</button>
      </div>

      <div className="tabs object-tabs" role="group" aria-label="Tipo de avisos">
        {sections.map((s) => (
          <button
            key={s}
            aria-pressed={section === s}
            className={section === s ? "active" : ""}
            onClick={() => {
              setSection(s);
              setCategory("Todas");
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="tabs">
          {["Todos", ...statuses].map((s) => (
            <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
        <select aria-label="Filtrar por categoría" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Todas</option>
          {categories.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="empty" role="alert">
          <h3>No pudimos cargar los avisos</h3>
          <p>{error}</p>
          <button onClick={onRetry}>Reintentar</button>
        </div>
      ) : loading ? (
        <div className="empty">Cargando los avisos…</div>
      ) : visible.length ? (
        <div className="grid">
          {visible.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              commentCount={comments.filter((c) => c.reportId === r.id).length}
              onOpen={() => onSelect(r.id)}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <span className="empty-icon">☏</span>
          <h3>{reports.length ? "No hay avisos con estos filtros" : "Tu aviso puede ser el primero"}</h3>
          <p>
            {reports.length
              ? "Prueba otra búsqueda o categoría."
              : "¿Has visto un problema? Compártelo para que la comunidad pueda ayudar."}
          </p>
          <button onClick={() => onPublish()}>＋ Publicar un aviso</button>
        </div>
      )}
    </section>
  );
}
