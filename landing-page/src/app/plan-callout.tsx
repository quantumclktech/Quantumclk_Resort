import Link from "next/link";
import { ArrowRight } from "./icons";
import { Sketch, type SketchName } from "./pencil";

/* The closing invitation on the list subpages (unit 3.18, phase 2).
 * Replaces the same 46 lines of inline-styled markup copied into all four
 * pages; the words are now one line instead of a paragraph. */

export default function PlanCallout({ title, href, action, sketch = "hills" }: {
  title: string;
  href: string;
  action: string;
  /** The pencil drawing beside the title (unit 3.22). */
  sketch?: SketchName;
}) {
  return (
    <section className="wrap sp-callout-section">
      <div className="sp-callout">
        <Sketch name={sketch} className="sp-callout-sketch" />
        <h2>{title}</h2>
        <Link href={href} className="sp-callout-btn">
          {action} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
