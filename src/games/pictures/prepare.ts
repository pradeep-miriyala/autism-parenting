// Getting a parent's photo ready for the game: turned the right way up, cropped to the board's shape (4 by 3),
// made no bigger than 1200 by 900 and saved as a JPEG. Drawing it again on a canvas also drops everything hidden
// in the file, such as where the photo was taken. Everything here happens on the device.

export const PHOTO_SIZE = { w: 1200, h: 900 }
const RATIO = PHOTO_SIZE.w / PHOTO_SIZE.h

/** The biggest 4 by 3 box that fits in a picture, taken from the middle. */
export function cropBox(w: number, h: number): { sx: number; sy: number; sw: number; sh: number } {
  let sw = w, sh = w / RATIO
  if (sh > h) { sh = h; sw = h * RATIO }
  return { sx: (w - sw) / 2, sy: (h - sh) / 2, sw, sh }
}

/** How big the saved picture is: the crop, shrunk to fit, never made bigger. */
export function outputSize(sw: number): { w: number; h: number } {
  const w = Math.max(4, Math.min(PHOTO_SIZE.w, Math.floor(sw)))
  return { w, h: Math.round(w / RATIO) }
}

type Decoded = { src: CanvasImageSource; w: number; h: number; done: () => void }

async function decode(file: Blob): Promise<Decoded | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return { src: bmp, w: bmp.width, h: bmp.height, done: () => bmp.close() }
  } catch {}
  // Older browsers: an image element, which also turns the photo the right way up by itself.
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((ok, no) => { img.onload = () => ok(); img.onerror = () => no(); img.src = url })
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: () => {} }
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Returns the ready picture, or null if the file could not be read as a picture. */
export async function preparePhoto(file: Blob): Promise<Blob | null> {
  const img = await decode(file)
  if (!img || img.w < 2 || img.h < 2) return null
  try {
    const { sx, sy, sw, sh } = cropBox(img.w, img.h)
    const out = outputSize(sw)
    const canvas = document.createElement('canvas')
    canvas.width = out.w
    canvas.height = out.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#fff'   // a see-through picture (a PNG) gets a white back
    ctx.fillRect(0, 0, out.w, out.h)
    ctx.drawImage(img.src, sx, sy, sw, sh, 0, 0, out.w, out.h)
    return await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85))
  } catch {
    return null
  } finally {
    img.done()
  }
}
