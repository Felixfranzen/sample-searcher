import { nativeImage } from 'electron';
import { createCanvas } from 'canvas';

/**
 * Creates a drag icon with the filename displayed
 */
export const createDragIcon = (filename: string): Electron.NativeImage => {
  const padding = 8;
  const fontSize = 13;

  // Create a temporary canvas to measure text
  const tempCanvas = createCanvas(100, 100);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const textWidth = tempCtx.measureText(filename).width;

  // Calculate canvas dimensions
  const width = textWidth + padding * 2;
  const height = fontSize + padding * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background with rounded corners
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 6);
  ctx.fill();

  // Draw filename
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(filename, padding, height / 2);

  // Convert canvas to NativeImage
  const buffer = canvas.toBuffer('image/png');
  return nativeImage.createFromBuffer(buffer);
}