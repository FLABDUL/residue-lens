import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = { title: "Accessibility | Residue Lens" };

export default function AccessibilityPage() {
  return <ContentPage eyebrow="Accessibility" title="Comparisons should work for more people." intro="We aim for WCAG 2.2 AA and test keyboard use, semantic structure, focus visibility, reduced motion and small screens.">
    <h2>Current support</h2><ul><li>Keyboard-operable controls and visible focus states.</li><li>Text alternatives for chart values and meaningful labels for controls.</li><li>Tables remain scrollable and labelled on narrow screens.</li><li>Motion is suppressed when your device requests reduced motion.</li><li>The interface does not rely on colour alone to communicate a value.</li></ul>
    <h2>Known limitations</h2><p>Interactive visualisations can still be demanding with high zoom or screen magnification. Every chart value is repeated in accessible text, and food detail pages provide a simpler linear view.</p>
    <h2>Report a problem</h2><p><a href="/feedback">Send an accessibility feedback note</a>. The form states whether the private inbox is connected before confirming receipt.</p>
    <p>Statement prepared: 31 August 2026.</p>
  </ContentPage>;
}
