import { useState } from "react";
import { Package } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

interface ProductImgProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconSize?: string;
}

export function ProductImg({ src, alt, className = "w-full h-full object-cover", iconSize = "w-12 h-12" }: ProductImgProps) {
  const [errored, setErrored] = useState(false);
  const resolved = resolveImageUrl(src ?? undefined);

  if (!resolved || errored) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <Package className={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}
