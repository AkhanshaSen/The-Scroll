import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

/** Must stay under send-scroll Edge Function MAX_IMAGE_BASE64_LEN (2_500_000). */
export const MAX_SEND_IMAGE_BASE64_LEN = 2_400_000

export async function captureStage(): Promise<string> {
  const stage = document.querySelector('.stage')
  if (!(stage instanceof HTMLElement)) throw new Error('Open a roll before exporting.')
  return captureElement(stage, { pixelRatio: 2 })
}

/**
 * Capture only the parchment for email/view links — not rollers or ribbon.
 * Downscales / converts to JPEG when the PNG would exceed the Edge Function size cap.
 */
/** Wait for fonts and layout before html-to-image (avoids blank captures on GitHub Pages). */
export async function preparePaperCapture(): Promise<void> {
  await waitForPaint()
  await waitForPaint()
  await waitForFonts(4000)
}

export async function captureSheetForSend(): Promise<string> {
  const sheet =
    document.querySelector('.stage .sheet') ?? document.querySelector('.stage .sheet-wrap')
  if (!(sheet instanceof HTMLElement)) {
    throw new Error('Open a roll before sending. The paper could not be found.')
  }

  const stage = document.querySelector('.stage')
  if (stage instanceof HTMLElement) stage.classList.add('is-capturing')

  try {
    await preparePaperCapture()
    let dataUrl = await captureElement(sheet, { pixelRatio: 1 })
    if (dataUrl.length > MAX_SEND_IMAGE_BASE64_LEN) {
      dataUrl = await shrinkForSend(dataUrl, 1200, 0.88)
    }
    if (dataUrl.length > MAX_SEND_IMAGE_BASE64_LEN) {
      dataUrl = await shrinkForSend(dataUrl, 900, 0.78)
    }
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('The paper image was not a valid image.')
    }
    if (dataUrl.length > MAX_SEND_IMAGE_BASE64_LEN) {
      throw new Error(
        'The paper image is too large to send (~2.5MB). Shorten the scroll or remove large drawings, then try again.',
      )
    }
    return dataUrl
  } finally {
    if (stage instanceof HTMLElement) stage.classList.remove('is-capturing')
  }
}

async function captureElement(
  el: HTMLElement,
  options: { pixelRatio: number },
): Promise<string> {
  // The grain filter is an SVG turbulence. Leaving it in the tree makes the
  // capture image stay blank, or never finish, so it is lifted out and put back.
  const root = el.closest('.stage') ?? el
  const parked = [...root.querySelectorAll('.grain')].map((node) => ({
    node,
    parent: node.parentNode,
    next: node.nextSibling,
  }))
  for (const item of parked) item.node.remove()
  try {
    const dataUrl = await withTimeout(
      toPng(el, {
        pixelRatio: options.pixelRatio,
        cacheBust: true,
        skipAutoScale: true,
        filter: (node) =>
          !node.classList?.contains('grain') && !node.classList?.contains('pen-banner'),
      }),
      25_000,
      'The paper image took too long. Lift the pen, then try Send by mail again.',
    )
    if (dataUrl.length < 8000) {
      throw new Error(
        'The paper image came out blank. Hard-refresh the page, lift the pen, and try again.',
      )
    }
    return dataUrl
  } finally {
    for (const item of parked) {
      if (item.parent) item.parent.insertBefore(item.node, item.next)
    }
  }
}

async function shrinkForSend(
  dataUrl: string,
  maxWidth: number,
  jpegQuality: number,
): Promise<string> {
  const image = await loadImage(dataUrl)
  const scale = Math.min(1, maxWidth / Math.max(image.width, 1))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('The paper image could not be resized.')
  ctx.fillStyle = '#fdf8ee'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', jpegQuality)
}

export async function downloadPdf(dataUrl: string, title: string) {
  const image = await loadImage(dataUrl)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297
  const margin = 12
  const maxWidth = pageWidth - margin * 2
  const maxHeight = pageHeight - margin * 2
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height)
  const width = image.width * ratio
  const height = image.height * ratio
  pdf.addImage(dataUrl, 'PNG', (pageWidth - width) / 2, margin, width, height)
  pdf.save(`${fileName(title)}.pdf`)
}

export function printSheet(dataUrl: string) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    return
  }
  doc.open()
  doc.write(`<!doctype html><html><head><title>Print</title><style>
    @page { margin: 12mm; }
    html, body { margin: 0; background: #fff; }
    img { display: block; width: 100%; height: auto; }
  </style></head><body><img alt="" src="${dataUrl}" /></body></html>`)
  doc.close()
  const image = doc.querySelector('img')
  if (!image) {
    frame.remove()
    return
  }
  image.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    window.setTimeout(() => frame.remove(), 1500)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read the paper image.'))
    image.src = src
  })
}

function fileName(title: string): string {
  const clean = title.replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 48)
  return clean || 'paper-scroll'
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function waitForFonts(ms: number): Promise<void> {
  if (!document.fonts?.ready) return Promise.resolve()
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
  ])
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}
