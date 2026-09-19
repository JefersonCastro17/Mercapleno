import { ApiKeyMiddleware } from '../../../src/common/logger/logger.middleware';
import { envs } from '../../../src/config';

describe('ApiKeyMiddleware', () => {
  let middleware: ApiKeyMiddleware;
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    middleware = new ApiKeyMiddleware();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    // Silence console.log during test
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe estar definido', () => {
    expect(middleware).toBeDefined();
  });

  it('debe retornar 401 si falta el header x-api-key', () => {
    mockRequest = {
      header: jest.fn().mockReturnValue(undefined),
      method: 'GET',
      originalUrl: '/api/test',
    };

    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Falta clave API' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('debe retornar 403 si el header x-api-key es invalido', () => {
    mockRequest = {
      header: jest.fn().mockReturnValue('clave-incorrecta'),
      method: 'GET',
      originalUrl: '/api/test',
    };

    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Clave API invalida' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('debe llamar a next() si el header x-api-key es valido', () => {
    mockRequest = {
      header: jest.fn().mockReturnValue(envs.internalApiKey),
      method: 'GET',
      originalUrl: '/api/test',
    };

    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});

