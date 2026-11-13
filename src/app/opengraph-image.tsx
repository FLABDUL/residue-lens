import { ImageResponse } from "next/og";

export const alt = "Residue Lens: compare pesticide residues in UK food";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#123f34", color: "#fffdf7", fontFamily: "Arial" }}><div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 28 }}><span style={{ display: "flex", width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "#d58a40", fontWeight: 800 }}>RL</span>Residue Lens</div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ color: "#a9d7b5", fontSize: 24, textTransform: "uppercase", letterSpacing: 4 }}>Official UK, US and European data</div><div style={{ maxWidth: 900, marginTop: 20, fontSize: 72, lineHeight: 1.02, letterSpacing: -3 }}>What’s actually been found on our food?</div></div><div style={{ fontSize: 25, color: "#c7d9d2" }}>Clear comparisons. Visible sample counts. No “dirty” lists.</div></div>, size);
}
