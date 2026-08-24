import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from '../../../src/auth/decorators/current-user.decorator';

function getParamDecoratorFactory(decorator: Function) {
  class TestController {
    public testMethod(@CurrentUser() _user: any) {}
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('CurrentUser Decorator (Unitarias)', () => {
  it('debe extraer el usuario autenticado del request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const mockUser = { id: 1, id_rol: 1, email: 'admin@test.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(null, mockContext);
    expect(result).toEqual(mockUser);
  });
});
