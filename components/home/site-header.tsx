export default function SiteHeader({ onPublish }: { onPublish: () => void }) {
  return (
    <header>
      <a className="brand" href="/">
        <span className="logo">
          b<span>•</span>
        </span>
        bolivia<span className="light">avisa</span>
      </a>
      <span className="header-note">Un espacio de la comunidad</span>
      <button onClick={onPublish}>＋ Publicar un aviso</button>
    </header>
  );
}
