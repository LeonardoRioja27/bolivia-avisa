/** Campo trampa para bots: las personas no lo ven y debe quedar vacío. */
export function HoneypotField() {
  return (
    <label className="honeypot" aria-hidden="true">
      Deja este campo vacío
      <input name="website" tabIndex={-1} autoComplete="off" />
    </label>
  );
}

/** Nombre o alias opcional: si se deja vacío, se publica como «anónimo». */
export function AuthorField() {
  return (
    <label>
      Tu nombre o alias (opcional)
      <input name="author" maxLength={50} placeholder="Si lo dejas vacío, aparecerás como anónimo" />
    </label>
  );
}

/** Aviso (sin casilla) de que publicar implica aceptar las normas. */
export function ConsentNote() {
  return (
    <p className="consent">
      Al enviar aceptas las{" "}
      <a href="/normas" target="_blank">
        normas y privacidad
      </a>
      .
    </p>
  );
}
