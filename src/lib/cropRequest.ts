// A bridge between `pickSquareImage` (a plain async function) and the cropper on screen: the picker asks, the
// CropperHost mounted in the root layout shows the photo and answers with the part the person framed.
export type CropRect = { originX: number; originY: number; width: number; height: number };
type Request = { uri: string; width: number; height: number; resolve: (rect: CropRect | null) => void };

let listener: ((r: Request | null) => void) | null = null;

export function onCropRequest(fn: (r: Request | null) => void) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

// Resolves to the framed square in image pixels, or null if the person cancelled (or nothing can show the cropper).
export function requestCrop(uri: string, width: number, height: number): Promise<CropRect | null> {
  if (!listener) return Promise.resolve(null);
  const show = listener;
  return new Promise((resolve) => show({ uri, width, height, resolve }));
}
