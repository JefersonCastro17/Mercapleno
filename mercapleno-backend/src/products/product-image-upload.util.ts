import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { diskStorage } from 'multer';

const PRODUCT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'productos');
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type MulterFileLike = {
  mimetype: string;
  originalname: string;
};

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;
type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/jfif': '.jpg',
  'image/jpe': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/tif': '.tif',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/jp2': '.jp2',
  'image/jxr': '.jxr',
  'image/jxl': '.jxl',
};

function resolveImageExtension(file: MulterFileLike) {
  const mappedExtension = MIME_EXTENSION_MAP[file.mimetype];
  if (mappedExtension) {
    return mappedExtension;
  }

  const originalExtension = extname(file.originalname || '').toLowerCase();
  if (originalExtension) {
    return originalExtension;
  }

  if (!file.mimetype.startsWith('image/')) {
    return '.bin';
  }

  const mimeSubtype = file.mimetype.slice('image/'.length).toLowerCase();
  const normalizedSubtype = mimeSubtype.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (!normalizedSubtype) {
    return '.img';
  }

  if (normalizedSubtype === 'svg-xml') {
    return '.svg';
  }

  return `.${normalizedSubtype}`;
}

function ensureProductUploadDir() {
  if (!existsSync(PRODUCT_UPLOAD_DIR)) {
    mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
  }
}

function sanitizeFileName(input: string) {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'producto';
}

export const productImageUploadOptions = {
  storage: diskStorage({
    destination: (_req: unknown, _file: MulterFileLike, callback: DestinationCallback) => {
      ensureProductUploadDir();
      callback(null, PRODUCT_UPLOAD_DIR);
    },
    filename: (_req: unknown, file: MulterFileLike, callback: FilenameCallback) => {
      const originalName = file.originalname || 'producto';
      const cleanBaseName = sanitizeFileName(originalName.replace(/\.[^.]+$/, ''));
      const extension = resolveImageExtension(file);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}`;

      callback(null, `${uniqueSuffix}-${cleanBaseName}${extension}`);
    },
  }),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req: unknown, file: MulterFileLike, callback: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }

    callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
  },
};

export function buildStoredProductImagePath(fileName: string) {
  return `/uploads/productos/${fileName}`;
}

export function resolveUploadedProductImagePath(file?: { filename?: string } | null) {
  if (!file?.filename) {
    return undefined;
  }

  return buildStoredProductImagePath(file.filename);
}

export function isStoredProductImage(imagePath?: string | null) {
  if (!imagePath) {
    return false;
  }

  return imagePath.startsWith('/uploads/productos/');
}

export function deleteStoredProductImage(imagePath?: string | null) {
  if (!isStoredProductImage(imagePath)) {
    return;
  }

  const normalizedImagePath = imagePath ?? '';
  const absolutePath = join(PRODUCT_UPLOAD_DIR, basename(normalizedImagePath));

  if (existsSync(absolutePath)) {
    unlinkSync(absolutePath);
  }
}
