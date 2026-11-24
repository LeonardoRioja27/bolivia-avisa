export default function Hero({ onPublish }: { onPublish: () => void }) {
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">
          <span /> VECINOS QUE SE AYUDAN
        </div>
        <h1>
          Lo que pasa aquí,
          <br />
          <em>lo resolvemos juntos.</em>
        </h1>
        <p>
          Un problema compartido es el primer paso para solucionarlo.
          <br className="desktop" /> Avisa, conversa y cuenta a tu comunidad cuando se resuelva.
        </p>
        <button onClick={onPublish}>
          Publicar mi primer aviso <span>↗</span>
        </button>
        <a className="textlink" href="#avisos">
          Ver los avisos ↓
        </a>
      </div>
      <div className="illustration" aria-hidden="true">
        <div className="orbit o1" />
        <div className="orbit o2" />
        <div className="bubble small">¿Alguien tiene novedades?</div>
        <div className="sample">
          <span className="sample-tag">EJEMPLO · TRANSPORTE</span>
          <strong>Problema con el tren 33</strong>
          <p>Compartamos lo que sabemos.</p>
          <div className="sample-bottom">
            <span className="avatars">
              A <i>B</i> <i>C</i>
            </span>
            <span>Tu comunidad, conectada</span>
          </div>
        </div>
        <div className="bubble resolved">✓ ¡Ya está arreglado!</div>
        <span className="spark">✳</span>
      </div>
    </section>
  );
}
