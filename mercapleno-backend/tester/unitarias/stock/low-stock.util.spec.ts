import { getLowStockMetadata, buildLowStockAlert } from '../../../src/common/stock/low-stock.util';
import { envs } from '../../../src/config';

describe('low-stock.util', () => {
  describe('getLowStockMetadata', () => {
    it('debe indicar stock bajo si es igual o menor al umbral', () => {
      const result = getLowStockMetadata(envs.lowStockThreshold);
      expect(result.isLowStock).toBe(true);
      expect(result.lowStockThreshold).toBe(envs.lowStockThreshold);
    });

    it('no debe indicar stock bajo si es mayor al umbral', () => {
      const result = getLowStockMetadata(envs.lowStockThreshold + 1);
      expect(result.isLowStock).toBe(false);
      expect(result.lowStockThreshold).toBe(envs.lowStockThreshold);
    });
  });

  describe('buildLowStockAlert', () => {
    it('debe retornar null si el stock esta sobre el umbral', () => {
      const result = buildLowStockAlert(1, envs.lowStockThreshold + 1);
      expect(result).toBeNull();
    });

    it('debe retornar alerta con nombre si el stock esta bajo el umbral', () => {
      const result = buildLowStockAlert(1, envs.lowStockThreshold - 1, 'Producto Test');
      expect(result).toEqual({
        productId: 1,
        productName: 'Producto Test',
        remainingStock: envs.lowStockThreshold - 1,
        threshold: envs.lowStockThreshold,
        message: `Stock bajo para Producto Test (ID 1): quedan ${envs.lowStockThreshold - 1} unidades.`
      });
    });

    it('debe retornar alerta sin nombre si el stock esta bajo el umbral y no se provee nombre', () => {
      const result = buildLowStockAlert(1, envs.lowStockThreshold - 1);
      expect(result).toEqual({
        productId: 1,
        productName: undefined,
        remainingStock: envs.lowStockThreshold - 1,
        threshold: envs.lowStockThreshold,
        message: `Stock bajo para producto ID 1: quedan ${envs.lowStockThreshold - 1} unidades.`
      });
    });
  });
});
