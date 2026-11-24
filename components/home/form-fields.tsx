/** Campo trampa para bots: las personas no lo ven y debe quedar vacío. */
export function HoneypotField() {
  return (
    <label className="honeypot" aria-hidden="true">
      Deja este campo vacío
      <input name="website" tabIndex={-1} autoComplete="off" />
    </label>
  );
}

export function ConsentCheckbox() {
  return (
    <label className="consent">
      <input type="checkbox" name="accepted" value="yes" required /> He leído las{" "}
      <a href="/normas" target="_blank">
        normas y privacidad
      </a>
      .
    </label>
  );
}
