import { formatDate, statuses, type Report } from "./shared";

export default function ReportCard({
  report: r,
  commentCount,
  onOpen,
}: {
  report: Report;
  commentCount: number;
  onOpen: () => void;
}) {
  return (
    <button className="card" onClick={onOpen}>
      <div className="cardtop">
        <span className="category">{r.category}</span>
        <span className={"badge s" + statuses.indexOf(r.status)}>{r.status}</span>
      </div>
      <h3>{r.title}</h3>
      {r.imageUrl && <img className="object-photo" src={r.imageUrl} alt={"Foto: " + r.title} loading="lazy" />}
      <p>{r.body}</p>
      <div className="location">⌖ {r.location}</div>
      <div className="cardfoot">
        <span>
          {r.author} · {formatDate(r.created)}
        </span>
        <span>♧ {commentCount} comentarios →</span>
      </div>
    </button>
  );
}
