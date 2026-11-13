import { getResidueHealthContext } from "@/lib/residue-health";

export function ResidueHealthContext({ residue }: { residue: string }) {
  const context = getResidueHealthContext(residue);
  if (context.status === "unavailable") {
    return <div className="residue-evidence residue-evidence-unavailable">
      <span className="evidence-status">Health summary pending</span>
      <p>No reviewed substance-specific summary is available, so no health effect is inferred.</p>
      <a href={context.sourceUrl} target="_blank" rel="noreferrer">Search WHO/FAO JMPR ↗</a>
    </div>;
  }

  return <div className="residue-evidence residue-evidence-reviewed">
    <span className="evidence-status">Reviewed evidence</span>
    <p><strong>What regulators assessed:</strong> {context.criticalEffect}</p>
    <details className="residue-reference-values">
      <summary>Reference values</summary>
      <dl>
        <div><dt>Role</dt><dd>{context.role}</dd></div>
        <div><dt>Long-term reference (ADI)</dt><dd>{context.adi}</dd></div>
        <div><dt>Single-day reference (ARfD)</dt><dd>{context.arfd}</dd></div>
      </dl>
      <p className="health-source">Reviewed from <a href={context.sourceUrl} target="_blank" rel="noreferrer">{context.authority}, {context.assessmentYear} ↗</a></p>
    </details>
  </div>;
}
