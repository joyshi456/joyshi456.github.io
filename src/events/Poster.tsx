interface Props {
  src: string
  alt: string
}

/**
 * Renders a flyer poster. Supports raster images (jpg/png/webp) and PDFs.
 * Pointer events are disabled so a click always reaches the flyer button
 * (which opens the sign-up sheet).
 */
export function Poster({ src, alt }: Props) {
  const isPdf = src.toLowerCase().split('?')[0].endsWith('.pdf')

  if (isPdf) {
    return (
      <object
        className="poster-media poster-media--pdf"
        data={`${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        type="application/pdf"
        aria-label={alt}
      >
        {/* fallback if the browser won't inline the PDF */}
        <span className="poster-pdf-fallback">{alt} (PDF)</span>
      </object>
    )
  }

  return <img className="poster-media" src={src} alt={alt} loading="lazy" />
}
