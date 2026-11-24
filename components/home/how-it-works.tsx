const steps = [
  { n: "01", title: "Cuenta qué pasa", text: "Describe el problema y dónde ocurre." },
  { n: "02", title: "Sumamos información", text: "Otras personas comentan y aportan novedades." },
  { n: "03", title: "Cerramos el círculo", text: "Actualiza el estado y explica qué ha cambiado." },
];

export default function HowItWorks() {
  return (
    <section className="how">
      <div className="eyebrow">ASÍ DE SENCILLO</div>
      <h2>De «hay un problema» a «ya se resolvió».</h2>
      <div className="steps">
        {steps.map((s) => (
          <div key={s.n}>
            <span>{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
