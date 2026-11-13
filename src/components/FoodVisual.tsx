import Image from "next/image";

export function FoodVisual({ canonicalId, category, name, decorative = false }: {
  canonicalId: string;
  category: string;
  name: string;
  decorative?: boolean;
}) {
  return <span
    className={`food-visual food-visual-${category.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`}
    data-artwork="catalogue"
  >
    <Image
      className="food-svg"
      src={`/food-art/${canonicalId}.svg`}
      width={96}
      height={96}
      unoptimized
      alt={decorative ? "" : `${name} illustration`}
    />
  </span>;
}
