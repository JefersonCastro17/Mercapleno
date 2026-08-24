import { mapAuthUserResponse, mapAdminUserResponse } from '../../../src/common/utils/user-mapper.util';

describe('UserMapperUtil (Unitarias)', () => {
  it('debe mapear un usuario para auth correctamente con relaciones', () => {
    const rawUser = {
      id: 1,
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juan@test.com',
      id_rol: 1,
      email_verified: true,
      roles: { id: 1, nombre: 'Admin' },
      tipos_identificacion: { id: 1, nombre: 'CC' },
    };

    const result = mapAuthUserResponse(rawUser);

    expect(result).toEqual({
      id: 1,
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juan@test.com',
      id_rol: 1,
      email_verified: true,
      rol: 'Admin',
      tipo_documento: 'CC',
    });
  });

  it('debe mapear un usuario para auth con relaciones nulas', () => {
    const rawUser = {
      id: 2,
      nombre: 'Maria',
      apellido: 'Gomez',
      email: 'maria@test.com',
      id_rol: 3,
      email_verified: false,
      roles: null,
      tipos_identificacion: null,
    };

    const result = mapAuthUserResponse(rawUser);

    expect(result).toEqual({
      id: 2,
      nombre: 'Maria',
      apellido: 'Gomez',
      email: 'maria@test.com',
      id_rol: 3,
      email_verified: false,
      rol: null,
      tipo_documento: null,
    });
  });

  it('debe mapear un usuario para admin con relaciones completas', () => {
    const rawUser = {
      id: 1,
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juan@test.com',
      direccion: 'Calle 10 # 20',
      fecha_nacimiento: new Date('1990-01-01'),
      id_rol: 1,
      id_tipo_identificacion: 1,
      numero_identificacion: '12345678',
      email_verified: true,
      roles: { id: 1, nombre: 'Admin' },
      tipos_identificacion: { id: 1, nombre: 'CC' },
    };

    const result = mapAdminUserResponse(rawUser);

    expect(result).toEqual({
      id: 1,
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juan@test.com',
      direccion: 'Calle 10 # 20',
      fecha_nacimiento: new Date('1990-01-01'),
      rol: 'Admin',
      tipo_identificacion: 'CC',
      numero_identificacion: '12345678',
      id_rol: 1,
      id_tipo_identificacion: 1,
      email_verified: true,
    });
  });

  it('debe mapear un usuario para admin con campos opcionales nulos', () => {
    const rawUser = {
      id: 2,
      nombre: 'Maria',
      apellido: 'Gomez',
      email: 'maria@test.com',
      id_rol: 2,
      email_verified: false,
    };

    const result = mapAdminUserResponse(rawUser);

    expect(result).toEqual({
      id: 2,
      nombre: 'Maria',
      apellido: 'Gomez',
      email: 'maria@test.com',
      direccion: null,
      fecha_nacimiento: null,
      rol: null,
      tipo_identificacion: null,
      numero_identificacion: '',
      id_rol: 2,
      id_tipo_identificacion: 1,
      email_verified: false,
    });
  });
});
