import { BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs';
import {
  buildStoredProductImagePath,
  resolveUploadedProductImagePath,
  isStoredProductImage,
  deleteStoredProductImage,
  productImageUploadOptions,
} from '../../../src/products/product-image-upload.util';

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('ProductImageUploadUtil (Unitarias)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildStoredProductImagePath', () => {
    it('debe construir la ruta relativa del archivo', () => {
      const result = buildStoredProductImagePath('foto1.png');
      expect(result).toBe('/uploads/productos/foto1.png');
    });
  });

  describe('resolveUploadedProductImagePath', () => {
    it('debe retornar undefined si no hay archivo o no tiene filename', () => {
      expect(resolveUploadedProductImagePath(null)).toBeUndefined();
      expect(resolveUploadedProductImagePath(undefined)).toBeUndefined();
      expect(resolveUploadedProductImagePath({})).toBeUndefined();
    });

    it('debe retornar la ruta si tiene filename', () => {
      const result = resolveUploadedProductImagePath({ filename: 'producto-123.jpg' });
      expect(result).toBe('/uploads/productos/producto-123.jpg');
    });
  });

  describe('isStoredProductImage', () => {
    it('debe retornar true solo si la ruta inicia con /uploads/productos/', () => {
      expect(isStoredProductImage('/uploads/productos/pan.png')).toBe(true);
      expect(isStoredProductImage('/otras/rutas/foto.png')).toBe(false);
      expect(isStoredProductImage(null)).toBe(false);
      expect(isStoredProductImage(undefined)).toBe(false);
      expect(isStoredProductImage('')).toBe(false);
    });
  });

  describe('deleteStoredProductImage', () => {
    it('no debe hacer nada si la imagen no es almacenada en uploads/productos', () => {
      deleteStoredProductImage('/externo/foto.jpg');
      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('debe eliminar el archivo si existe', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      deleteStoredProductImage('/uploads/productos/leche.png');

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('no debe llamar unlinkSync si el archivo no existe físicamente', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      deleteStoredProductImage('/uploads/productos/inexistente.png');

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('productImageUploadOptions', () => {
    it('fileFilter debe aceptar mimetypes de imagen', (done) => {
      const callback = (err: Error | null, accepted: boolean) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        done();
      };

      productImageUploadOptions.fileFilter(null, { mimetype: 'image/png', originalname: 'test.png' }, callback);
    });

    it('fileFilter debe rechazar mimetypes que no son imagen', (done) => {
      const callback = (err: Error | null, accepted: boolean) => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(accepted).toBe(false);
        done();
      };

      productImageUploadOptions.fileFilter(null, { mimetype: 'application/pdf', originalname: 'doc.pdf' }, callback);
    });
  });
});
