// File type guard — verifies real content via magic bytes, not just headers
export const IMAGE_MIME = {
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/webp": { ext: "webp", magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF
};

// Matches a buffer against the expected magic bytes for a given extension
export const sniffImage = (ext, buf) => {
  const info = Object.values(IMAGE_MIME).find((m) => m.ext === ext);
  if (!info) return false;
  return info.magic.every((b, i) => buf[i] === b);
};

// PDF files start with "%PDF-"
export const sniffPdf = (buf) => {
  if (!buf || buf.length < 5) return false;
  return (
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46 &&
    buf[4] === 0x2d
  );
};
