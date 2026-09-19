import {
  buildStoredProductImagePath,
  resolveUploadedProductImagePath,
  isStoredProductImage,
  deleteStoredProductImage,
  productImageUploadOptions,
} from '../../../src/products/product-image-upload.util';
import * as fs from 'node:fs';

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('Product Image Upload Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Path helpers', () => {
    it('buildStoredProductImagePath debe concatenar prefijo y nombre de archivo', () => {
      expect(buildStoredProductImagePath('foto.png')).toBe('/uploads/productos/foto.png');
    });

    it('resolveUploadedProductImagePath debe retornar undefined si no hay archivo o filename', () => {
      expect(resolveUploadedProductImagePath(null)).toBeUndefined();
      expect(resolveUploadedProductImagePath(undefined)).toBeUndefined();
      expect(resolveUploadedProductImagePath({})).toBeUndefined();
      expect(resolveUploadedProductImagePath({ filename: '' })).toBeUndefined();
    });

    it('resolveUploadedProductImagePath debe retornar la ruta si filename existe', () => {
      expect(resolveUploadedProductImagePath({ filename: 'img1.jpg' })).toBe('/uploads/productos/img1.jpg');
    });

    it('isStoredProductImage valida prefijos correctamente', () => {
      expect(isStoredProductImage(null)).toBe(false);
      expect(isStoredProductImage(undefined)).toBe(false);
      expect(isStoredProductImage('')).toBe(false);
      expect(isStoredProductImage('/uploads/otra-cosa/foto.jpg')).toBe(false);
      expect(isStoredProductImage('/uploads/productos/foto.jpg')).toBe(true);
    });

    it('deleteStoredProductImage debe eliminar el archivo si existe', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      deleteStoredProductImage('/uploads/productos/mi-foto.png');

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('deleteStoredProductImage no debe hacer nada si la ruta no es valida o el archivo no existe', () => {
      deleteStoredProductImage('/otra/ruta/foto.jpg');
      expect(fs.unlinkSync).not.toHaveBeenCalled();

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      deleteStoredProductImage('/uploads/productos/no-existe.jpg');
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('productImageUploadOptions', () => {
    it('fileFilter debe aceptar archivos con mimetype image/*', (done) => {
      const callback = (err: any, accept: boolean) => {
        expect(err).toBeNull();
        expect(accept).toBe(true);
        done();
      };

      productImageUploadOptions.fileFilter({} as any, { mimetype: 'image/png', originalname: 'test.png' }, callback);
    });

    it('fileFilter debe rechazar archivos que no sean imagen', (done) => {
      const callback = (err: any, accept: boolean) => {
        expect(err).toBeDefined();
        expect(accept).toBe(false);
        done();
      };

      productImageUploadOptions.fileFilter({} as any, { mimetype: 'application/pdf', originalname: 'doc.pdf' }, callback);
    });

    it('destination callback debe asegurar directorio y llamar callback con el path', (done) => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const callback = (err: any, dest: string) => {
        expect(err).toBeNull();
        expect(dest).toContain('productos');
        expect(fs.mkdirSync).toHaveBeenCalled();
        done();
      };

      (productImageUploadOptions.storage as any).getDestination({} as any, {} as any, callback);
    });

    it('filename callback debe sanitizar y generar nombre con extension adecuada', (done) => {
      const file = {
        originalname: 'Café Especial & Premium.png',
        mimetype: 'image/png',
      };

      const callback = (err: any, filename: string) => {
        expect(err).toBeNull();
        expect(filename).toMatch(/-Cafe-Especial-Premium\.png$/);
        done();
      };

      (productImageUploadOptions.storage as any).getFilename({} as any, file, callback);
    });

    it('filename callback debe resolver extensiones por MIME mapeado, fallback o extension original', (done) => {
      const fileJpeg = { originalname: 'foto', mimetype: 'image/jpeg' };
      (productImageUploadOptions.storage as any).getFilename({} as any, fileJpeg, (err: any, filename: string) => {
        expect(filename.endsWith('.jpg')).toBe(true);
      });

      const fileSvg = { originalname: '', mimetype: 'image/svg+xml' };
      (productImageUploadOptions.storage as any).getFilename({} as any, fileSvg, (err: any, filename: string) => {
        expect(filename.endsWith('.svg')).toBe(true);
      });

      const fileCustom = { originalname: 'archivo.webp', mimetype: 'other/unknown' };
      (productImageUploadOptions.storage as any).getFilename({} as any, fileCustom, (err: any, filename: string) => {
        expect(filename.endsWith('.webp')).toBe(true);
        done();
      });
    });
  });
});

