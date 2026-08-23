import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;

  const prismaMock = {
    productos: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('CP-046: debe registrar el producto y mapear el estado correctamente', async () => {
    const dto: CreateProductDto = {
      nombre: 'Pan Frances',
      id_categoria: 1,
      id_proveedor: 1,
      precio: 3500,
      estado: 'Disponible',
    };
    const productoCreado = { id_productos: 1, ...dto, estado: 'Disponible' };
    prismaMock.productos.create.mockResolvedValue(productoCreado as any);

    const resultado = await service.create(dto);

    expect(prismaMock.productos.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.productos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nombre: 'Pan Frances', estado: 'Disponible' }),
      }),
    );
    expect(resultado).toEqual({
      message: 'Producto agregado correctamente',
      id: 1,
    });
  });

  it('debe propagar el error si Prisma falla al crear el producto', async () => {
    const dto: CreateProductDto = {
      nombre: 'Pan Frances',
      id_categoria: 1,
      id_proveedor: 1,
      precio: 3500,
      estado: 'Disponible',
    };
    prismaMock.productos.create.mockRejectedValue(new Error('Connection lost'));

    await expect(service.create(dto)).rejects.toThrow('No se pudo crear el producto');
  });

  it('CP-047: debe rechazar un nombre de producto que contenga números', async () => {
    const dtoInstance = plainToInstance(CreateProductDto, {
      nombre: 'Pan123',
      id_categoria: 1,
      id_proveedor: 1,
      precio: 3500,
      estado: 'Disponible',
    });

    const errores = await validate(dtoInstance);

    expect(errores.length).toBeGreaterThan(0);
    expect(errores.some((e) => e.property === 'nombre')).toBe(true);
  });

  it('debe aceptar un nombre de producto válido (sin números)', async () => {
    const dtoInstance = plainToInstance(CreateProductDto, {
      nombre: 'Pan Frances',
      id_categoria: 1,
      id_proveedor: 1,
      precio: 3500,
      estado: 'Disponible',
    });

    const errores = await validate(dtoInstance);
    expect(errores.length).toBe(0);
  });
});