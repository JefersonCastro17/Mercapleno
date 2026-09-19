import { AllExceptionsFilter } from '../../../src/common/filters/http-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      url: '/api/v1/test',
      method: 'POST',
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    // Silence logger error outputs during tests
    jest.spyOn((filter as any).logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe estar definido', () => {
    expect(filter).toBeDefined();
  });

  it('debe manejar HttpException con respuesta en objeto y errorCode custom', () => {
    const exception = new HttpException(
      { message: 'Datos invalidos', errorCode: 'CUSTOM_ERR_01', customField: 123 },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        errorCode: 'CUSTOM_ERR_01',
        message: 'Datos invalidos',
        customField: 123,
        path: '/api/v1/test',
        method: 'POST',
      }),
    );
  });

  it('debe manejar HttpException con respuesta en string y asignar códigos por status', () => {
    const statuses = [
      { status: HttpStatus.BAD_REQUEST, code: 'ERR_400_BAD_REQUEST' },
      { status: HttpStatus.UNAUTHORIZED, code: 'ERR_401_UNAUTHORIZED' },
      { status: HttpStatus.FORBIDDEN, code: 'ERR_403_FORBIDDEN' },
      { status: HttpStatus.NOT_FOUND, code: 'ERR_404_NOT_FOUND' },
      { status: HttpStatus.CONFLICT, code: 'ERR_409_CONFLICT' },
      { status: HttpStatus.UNPROCESSABLE_ENTITY, code: 'ERR_422_UNPROCESSABLE_ENTITY' },
    ];

    for (const item of statuses) {
      const exception = new HttpException('Error mensaje', item.status);
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(item.status);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: item.status,
          errorCode: item.code,
          message: 'Error mensaje',
        }),
      );
    }
  });

  it.each([
    {
      caseName: 'CORS',
      err: new Error('CORS origin blocked'),
      status: HttpStatus.FORBIDDEN,
      errorCode: 'ERR_403_CORS_BLOCKED',
      message: 'Solicitud bloqueada por política CORS',
    },
    {
      caseName: 'database',
      err: new Error('database connection lost'),
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'ERR_500_DATABASE_ERROR',
      message: 'Error de conexión a la base de datos',
    },
    {
      caseName: 'Prisma',
      err: new Error('PrismaClientKnownRequestError'),
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'ERR_500_PRISMA_ERROR',
      message: 'Error en la operación de base de datos',
    },
    {
      caseName: 'generico',
      err: new Error('Something exploded unexpectedly'),
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'ERR_500_INTERNAL_SERVER_ERROR',
      message: 'Something exploded unexpectedly',
    },
  ])('debe manejar Error de $caseName', ({ err, status, errorCode, message }) => {
    filter.catch(err, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(status);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: status,
        errorCode,
        message,
      }),
    );
  });

  it('debe manejar excepciones no-Error desconocidas', () => {
    filter.catch('Un error en string raro', mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'ERR_500_INTERNAL_SERVER_ERROR',
        message: 'Error Interno del Servidor',
      }),
    );
  });
});

