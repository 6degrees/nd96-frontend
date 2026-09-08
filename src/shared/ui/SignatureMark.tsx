/** Renders a message author's hand-drawn signature SVG (inherits text color). */
export function SignatureMark({
  svg,
  className,
}: {
  svg: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`[&_path]:stroke-current [&_svg]:h-full [&_svg]:w-full ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
