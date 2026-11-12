import Image from "next/image";

export function SiteBrand({
  name,
  tagline,
  logoUrl,
  className,
}: {
  name: string;
  tagline: string;
  logoUrl: string;
  className?: string;
}) {
  return (
    <span className={`brand${className ? ` ${className}` : ""}`}>
      {logoUrl ? (
        <span className="brand-logo-frame">
          <Image
            alt={name}
            className="brand-logo-image"
            fill
            sizes="(max-width: 640px) 140px, 190px"
            src={logoUrl}
            unoptimized
          />
        </span>
      ) : (
        <>
          <span className="brand-mark" aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="brand-wordmark">
            <strong>{name}</strong>
            <small>{tagline}</small>
          </span>
        </>
      )}
    </span>
  );
}
