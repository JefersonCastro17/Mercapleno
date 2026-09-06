import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma, productos_estado } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { deleteStoredProductImage } from './product-image-upload.util';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private handlePersistenceError(error: unknown, fallbackMessage: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('ProductsService Prisma error:', error.code, error.meta ?? error.message);
      if (error.code === 'P2003') {
        throw new BadRequestException({
          message: 'La categoria o el proveedor seleccionados no existen en la base de datos',
        });
      }
    }

    if (error instanceof Error) {
      console.error('ProductsService persistence error:', error.message);
      console.error(error.stack);
    } else {
      console.error('ProductsService persistence error:', error);
    }

    throw new InternalServerErrorException({ message: fallbackMessage });
  }

  async findAll() {
    const products = await this.prisma.productos.findMany({
      include: {
        categoria: {
          select: {
            id_categoria: true,
            nombre: true,
          },
        },
        proveedor: {
          select: {
            id_proveedor: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { id_productos: 'asc' },
    });

    return products.map((product) => ({
      id_productos: product.id_productos,
      nombre: product.nombre,
      precio: product.precio,
      id_categoria: product.id_categoria,
      id_proveedor: product.id_proveedor,
      descripcion: product.descripcion,
      estado: product.estado,
      imagen: product.imagen,
      categoria_nombre: product.categoria?.nombre ?? null,
      proveedor_nombre: [product.proveedor?.nombre, product.proveedor?.apellido]
        .filter(Boolean)
        .join(' ')
        .trim() || null,
    }));
  }

  async getCatalogs() {
    const [categorias, proveedores] = await Promise.all([
      this.prisma.categoria.findMany({
        select: {
          id_categoria: true,
          nombre: true,
        },
        orderBy: {
          nombre: 'asc',
        },
      }),
      this.prisma.proveedor.findMany({
        select: {
          id_proveedor: true,
          nombre: true,
          apellido: true,
        },
        orderBy: {
          nombre: 'asc',
        },
      }),
    ]);

    return {
      categorias: categorias.map((categoria) => ({
        id: categoria.id_categoria,
        nombre: categoria.nombre ?? `Categoria ${categoria.id_categoria}`,
      })),
      proveedores: proveedores.map((proveedor) => ({
        id: proveedor.id_proveedor,
        nombre: [proveedor.nombre, proveedor.apellido].filter(Boolean).join(' ').trim() || `Proveedor ${proveedor.id_proveedor}`,
      })),
    };
  }

  async create(dto: CreateProductDto, uploadedImagePath?: string) {
    const normalizedImage = this.normalizeImagePath(uploadedImagePath ?? dto.imagen);

    try {
      const product = await this.prisma.productos.create({
        data: {
          nombre: dto.nombre,
          precio: dto.precio,
          id_categoria: dto.id_categoria,
          id_proveedor: dto.id_proveedor,
          descripcion: dto.descripcion || null,
          estado: this.mapEstado(dto.estado),
          imagen: normalizedImage,
        },
      });

      return {
        message: 'Producto agregado correctamente',
        id: product.id_productos,
      };
    } catch (error) {
      if (uploadedImagePath) {
        deleteStoredProductImage(uploadedImagePath);
      }

      if (error instanceof HttpException) {
        throw error;
      }

      this.handlePersistenceError(error, 'No se pudo crear el producto');
    }
  }

  async update(id: number, dto: UpdateProductDto, uploadedImagePath?: string) {
    const existing = await this.prisma.productos.findUnique({
      where: { id_productos: id },
      select: { id_productos: true, imagen: true },
    });

    if (!existing) {
      if (uploadedImagePath) {
        deleteStoredProductImage(uploadedImagePath);
      }

      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    const nextImage =
      uploadedImagePath !== undefined
        ? this.normalizeImagePath(uploadedImagePath)
        : dto.imagen !== undefined
          ? this.normalizeImagePath(dto.imagen)
          : undefined;

    try {
      await this.prisma.productos.update({
        where: { id_productos: id },
        data: {
          ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
          ...(dto.precio !== undefined ? { precio: dto.precio } : {}),
          ...(dto.id_categoria !== undefined ? { id_categoria: dto.id_categoria } : {}),
          ...(dto.id_proveedor !== undefined ? { id_proveedor: dto.id_proveedor } : {}),
          ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion || null } : {}),
          ...(dto.estado !== undefined ? { estado: this.mapEstado(dto.estado) } : {}),
          ...(nextImage !== undefined ? { imagen: nextImage } : {}),
        },
      });
    } catch (error) {
      console.error('ProductsService.update error:', error);

      if (uploadedImagePath) {
        deleteStoredProductImage(uploadedImagePath);
      }

      if (error instanceof HttpException) {
        throw error;
      }

      this.handlePersistenceError(error, 'No se pudo actualizar el producto');
    }

    if (uploadedImagePath && existing.imagen && existing.imagen !== uploadedImagePath) {
      deleteStoredProductImage(existing.imagen);
    }

    return { message: 'Producto actualizado correctamente' };
  }

    async remove(id: number) {
      const existing = await this.prisma.productos.findUnique({
        where: { id_productos: id },
        select: { id_productos: true, imagen: true },
      });

      if (!existing) {
        throw new NotFoundException({ message: 'Producto no encontrado' });
      }

      try {
        if (typeof (this.prisma as any).$transaction === 'function') {
          await this.prisma.$transaction(async (tx) => {
            await tx.venta_productos?.deleteMany?.({ where: { id_productos: id } });
            await tx.stock_actual?.deleteMany?.({ where: { id_productos: id } });
            await tx.salida_productos?.deleteMany?.({ where: { id_productos: id } });
            await tx.entrada_productos?.deleteMany?.({ where: { id_productos: id } });
            await tx.devolver_productos?.deleteMany?.({ where: { id_productos: id } });
            await tx.productos?.delete?.({ where: { id_productos: id } });
          });
        } else {
          // Fallback sequential deletions
          await this.prisma.venta_productos?.deleteMany?.({ where: { id_productos: id } });
          await this.prisma.stock_actual?.deleteMany?.({ where: { id_productos: id } });
          await this.prisma.salida_productos?.deleteMany?.({ where: { id_productos: id } });
          await this.prisma.entrada_productos?.deleteMany?.({ where: { id_productos: id } });
          await this.prisma.devolver_productos?.deleteMany?.({ where: { id_productos: id } });
          await this.prisma.productos?.delete?.({ where: { id_productos: id } });
        }
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
          throw new BadRequestException({
            message:
              'No se puede eliminar el producto porque existen registros relacionados en stock, ventas o movimientos.',
          });
        }
        throw new InternalServerErrorException({ message: 'No se pudo eliminar el producto' });
      }

      deleteStoredProductImage(existing.imagen);

      return { message: 'Producto eliminado correctamente' };
    }

  private normalizeImagePath(imagePath?: string | null) {
    if (typeof imagePath !== 'string') {
      return null;
    }

    const normalized = imagePath.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private mapEstado(estado: string): productos_estado {
    const normalized = estado.trim().toLowerCase();

    if (normalized === 'disponible') return productos_estado.Disponible;
    if (normalized === 'agotado') return productos_estado.Agotado;
    if (normalized === 'deshabilitado' || normalized === 'no disponible') return productos_estado.Deshabilitado;

    // Throw a generic error to be caught as InternalServerErrorException in create/update
    throw new Error('Estado de producto invalido');
  }
}
