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
  'image/png': '.png',
  'image/webp': '.webp',
};

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
      const extension = MIME_EXTENSION_MAP[file.mimetype] || extname(originalName).toLowerCase() || '.bin';
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}`;

      callback(null, `${uniqueSuffix}-${cleanBaseName}${extension}`);
    },
  }),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req: unknown, file: MulterFileLike, callback: FileFilterCallback) => {
    if (MIME_EXTENSION_MAP[file.mimetype]) {
      callback(null, true);
      return;
    }

    callback(new BadRequestException('Solo se permiten imagenes JPG, PNG, WEBP o GIF'), false);
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
