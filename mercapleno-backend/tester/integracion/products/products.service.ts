import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma, productos_estado } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { deleteStoredProductImage } from './product-image-upload.util';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private handlePersistenceError(error: unknown, fallbackMessage: string): never {
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2003') {
        throw new BadRequestException({
          message: 'La categoria o el proveedor seleccionados no existen en la base de datos',
        });
      }
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

    return products.map((product: typeof products[number]) => ({
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
      categorias: categorias.map((categoria: typeof categorias[number]) => ({
        id: categoria.id_categoria,
        nombre: categoria.nombre ?? `Categoria ${categoria.id_categoria}`,
      })),
      proveedores: proveedores.map((proveedor: typeof proveedores[number]) => ({
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
      if (uploadedImagePath) {
        deleteStoredProductImage(uploadedImagePath);
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

    await this.prisma.productos.delete({
      where: { id_productos: id },
    });

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

    throw new BadRequestException('Estado de producto invalido');
  }
}
