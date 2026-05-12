import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

export async function imageOptimizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // We only care about GET requests for images
  if (req.method !== 'GET') {
    return next();
  }

  const urlPath = req.path;
  const ext = path.extname(urlPath).toLowerCase();

  // Check if it's an image we can optimize
  if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
    return next();
  }

  // Define the base upload directory
  const uploadDir = path.join(process.cwd(), 'uploads');
  // Strip the leading slash
  const relativePath = urlPath.replace(/^\//, '');
  const absolutePath = path.join(uploadDir, relativePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    return next();
  }

  try {
    // If client accepts WebP, serve WebP instead of the original format
    const acceptsWebp = req.headers.accept?.includes('image/webp');
    const widthRaw = req.query.w || req.query.width;
    const width = widthRaw ? parseInt(widthRaw as string, 10) : undefined;

    // Fast path: if no resizing and original is requested (or they don't accept webp)
    if (!width && !acceptsWebp) {
      return next();
    }

    const format = acceptsWebp ? 'webp' : ext.replace('.', '');
    const contentType = `image/${format === 'jpg' ? 'jpeg' : format}`;

    // Configure sharp
    let processor = sharp(absolutePath);

    if (width && !isNaN(width)) {
      processor = processor.resize({ width, withoutEnlargement: true });
    }

    if (acceptsWebp) {
      processor = processor.webp({ quality: 80, effort: 4 });
    }

    const buffer = await processor.toBuffer();

    // Send optimized response with cache headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err) {
    console.error('Image optimization failed:', err);
    next(); // Fallback to express.static
  }
}
