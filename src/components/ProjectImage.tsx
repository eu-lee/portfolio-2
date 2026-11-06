import { useState } from "react";
import type { ImgHTMLAttributes } from "react";

export function ProjectImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSource, setFailedSource] = useState<string>();
  const youtubeThumbnail = src?.includes("img.youtube.com/vi/");
  const highResolution = youtubeThumbnail && src ? src.replace("/hqdefault.jpg", "/maxresdefault.jpg") : src;
  const useHighResolution = highResolution !== src && failedSource !== highResolution;

  return <img {...props} src={useHighResolution ? highResolution : src}
    onError={() => { if (useHighResolution) setFailedSource(highResolution); }}
    onLoad={(event) => {
      // YouTube can return a small placeholder instead of a missing-image error.
      if (useHighResolution && event.currentTarget.naturalWidth <= 120) {
        setFailedSource(highResolution);
      }
    }} />;
}
