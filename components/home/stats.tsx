import type { Report } from "./shared";

export default function Stats({ reports }: { reports: Report[] }) {
  const resolved = reports.filter((r) => r.status === "Resuelto").length;
  return (
    <section className="stats">
      <div>
        <strong>{reports.length}</strong>
        <span>Avisos compartidos</span>
      </div>
      <div>
        <strong>{reports.length - resolved}</strong>
        <span>Necesitan atención</span>
      </div>
      <div>
        <strong className="green">{resolved}</strong>
        <span>Problemas resueltos</span>
      </div>
      <p>
        Cada actualización
        <br />
        <b>nos ayuda a todos.</b> ↗
      </p>
    </section>
  );
}
