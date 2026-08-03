import type { CSSProperties } from "react";

type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
};

// Drop-in replacement for `next/image` for the static React build.
export default function Image({ src, alt, width, height, className, style }: ImageProps) {
  const dims: CSSProperties = {};
  if (width) dims.width = width;
  if (height) dims.height = height;
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ ...dims, ...style }}
    />
  );
}
