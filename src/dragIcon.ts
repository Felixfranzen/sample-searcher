import { nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'

export function createDragIcon(outputPath: string): void {
  // Option 1: Create from base64 (example: a simple blue square)
  const base64Icon = 'iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAABFElEQVQokY2SvQ6CMBSFv1ZjYuLLOLg7ODj5/E7OTq5OvgCDg6OJiQ9g0AEHf1p/SJtyk5Jr09vcc3NKAQAAAAD4F8aYklLaSikNpVQAiIg0InJUShVSyhljLMdx3H3f7+q6/ux53kfTNO9lWb5IKZ+yLB+UUo+u6956nidzzh2llJum+WDbNhiGAZqmgW3bQNu2oOs6GIYBhmGAbdu/wziOEccxxnEMY4wxDAPjOAIAQJZlkCQJxHEMcRxDkiSQpikAAKRpClEUQRRFEMcxxHGMKIoAAGCaJnieB77vg+d54Ps+OI4DAACmaYJpmqBpGrqu6/u+a9u2c13XM02T2rYNruv+fNd1wfM88DwPPM8D13VB0zRQVRVkWQZpmkKe5z/f5Xn+V7g18gUOk5OyJR6kQQAAAABJRU5ErkJggg=='
  const image = nativeImage.createFromBuffer(Buffer.from(base64Icon, 'base64'))
  fs.writeFileSync(outputPath, image.toPNG())
}

// Option 2: Create from an image with resize/modifications
export function loadAndResizeDragIcon(sourcePath: string, outputPath: string, size: number = 32): void {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source icon not found: ${sourcePath}`)
  }
  
  const image = nativeImage.createFromPath(sourcePath)
  const resized = image.resize({ width: size, height: size })
  fs.writeFileSync(outputPath, resized.toPNG())
}
