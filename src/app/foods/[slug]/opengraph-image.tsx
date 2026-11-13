import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import data from "@/data/global-pesticides-latest.json";
import type { Dataset } from "@/data/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
const dataset = data as Dataset;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const food = dataset.foods.find((item) => item.id === slug); if (!food) notFound();
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px", background: "#f4f1e8", color: "#17352c", fontFamily: "Arial" }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}><b>Residue Lens</b><span>{food.market ?? food.region} · {food.year}</span></div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ color: "#557367", fontSize: 25 }}>Standard-grown samples with any detected residue</div><div style={{ display: "flex", alignItems: "baseline", gap: 30, marginTop: 12 }}><span style={{ fontSize: 150, lineHeight: 1, color: "#174f3d", letterSpacing: -8 }}>{food.conventional.detectedPct}%</span><span style={{ fontSize: 58 }}>{food.name}</span></div></div><div style={{ display: "flex", justifyContent: "space-between", color: "#557367", fontSize: 23 }}><span>Based on {food.conventional.samples} standard-grown samples</span><span>Detection is not a health-risk verdict</span></div></div>, size);
}
