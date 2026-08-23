import { envs } from '../../config';

export interface LowStockAlert {
  productId: number;
  productName?: string;
  remainingStock: number;
  threshold: number;
  message: string;
}

// Keep threshold logic in one place so inventory and sales stay aligned.
export const getLowStockMetadata = (stock: number) => ({
  isLowStock: stock <= envs.lowStockThreshold,
  lowStockThreshold: envs.lowStockThreshold,
});

export const buildLowStockAlert = (
  productId: number,
  remainingStock: number,
  productName?: string,
): LowStockAlert | null => {
  if (remainingStock > envs.lowStockThreshold) {
    return null;
  }

  const label = productName?.trim() ? `${productName} (ID ${productId})` : `producto ID ${productId}`;

  return {
    productId,
    productName,
    remainingStock,
    threshold: envs.lowStockThreshold,
    message: `Stock bajo para ${label}: quedan ${remainingStock} unidades.`,
  };
};
