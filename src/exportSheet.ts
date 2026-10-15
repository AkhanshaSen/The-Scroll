import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

export async function captureStage(): Promise<string> {
  const stage = document.querySelector('.stage')
  if (!(stage instanceof HTMLElement)) throw new Error('Open a roll before exporting.')
  // The grain filter is an SVG turbulence. Leaving it in the tree makes the
  // capture image stay blank, or never finish, so it is lifted out and put back.
  const parked = [...stage.querySelectorAll('.grain')].map((node) => ({
    node,
    parent: node.parentNode,
    next: node.nextSibling,
  }))
  stage.classList.add('is-capturing')
  for (const item of parked) item.node.remove()
  try {
    return await toPng(stage, { pixelRatio: 2, cacheBust: true })
  } finally {
    for (const item of parked) {
      if (item.parent) item.parent.insertBefore(item.node, item.next)
    }
    stage.classList.remove('is-capturing')
  }
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
