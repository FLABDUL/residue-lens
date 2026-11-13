import { LensLeafMark } from "@/components/BrandMark";

export function HomeArtwork() {
  return (
    <div className="home-artwork" aria-hidden="true">
      <span className="home-art-orbit home-art-orbit-one" />
      <span className="home-art-orbit home-art-orbit-two" />
      <LensLeafMark className="home-art-lens" decorative />
      <svg className="home-art-produce" viewBox="0 0 320 250">
        <g className="home-grapes">
          <path d="M210 42c18-20 39-19 53-7-17 14-34 18-53 7Z" />
          <circle cx="191" cy="83" r="25" /><circle cx="229" cy="80" r="25" />
          <circle cx="263" cy="93" r="25" /><circle cx="209" cy="118" r="25" />
          <circle cx="246" cy="129" r="25" /><circle cx="226" cy="164" r="25" />
        </g>
        <g className="home-lemon">
          <path d="M44 123c5-42 55-65 91-38 36 26 24 78-14 97-38 20-82-16-77-59Z" />
          <path d="M84 79c9-24 30-35 53-27-10 21-28 31-53 27Z" />
        </g>
        <g className="home-leaves">
          <path d="M65 208c7-27 26-40 54-36-7 27-25 40-54 36Z" />
          <path d="M141 213c4-24 20-38 45-38-3 25-19 38-45 38Z" />
        </g>
      </svg>
    </div>
  );
}
