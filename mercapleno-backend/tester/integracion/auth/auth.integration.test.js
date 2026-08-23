const request = require('supertest');
const express = require('express');

describe('Pruebas de Integración - Mock API de Autenticación', () => {
  let app;

  const tokenCliente = 'mock-cliente-jwt-token-abc';
  const tokenAdmin = 'mock-admin-jwt-token-xyz';
  const pendingTokenAdmin = 'mock-pending-token-99';

  // Base de datos en memoria para simular el comportamiento del backend durante las pruebas
  let mockUsersDb = [];

  //crear usuarios de prueba con datos por defecto y permitir sobrescribir algunos campos
  const createUser = (overrides = {}) => ({
    id: 2,
    nombre: 'Juan',
    apellido: 'Perez',
    email: 'juan.perez@example.com',
    password: 'Password123!',
    id_rol: 3,
    email_verified: false,
    ...overrides,
  });

  beforeAll(() => {
    // Se crea una app Express aislada para simular el backend de autenticación
    app = express();
    app.use(express.json());


    //registrar usuarios
    app.post('/api/auth/register', (req, res) => {
      const { nombre, apellido, email, password, direccion, fecha_nacimiento, id_rol, numero_identificacion } = req.body;

      if (!email || !password || !nombre) {
        return res.status(400).json({ success: false, message: 'Campos obligatorios faltantes' });
      }

      const existe = mockUsersDb.find((user) => user.email === email);
      if (existe) {
        return res.status(409).json({ success: false, message: 'El email ya está registrado' });
      }

      const codigoVerificacion = '123456';
      const nuevoUsuario = {
        id: mockUsersDb.length + 1,
        nombre,
        apellido,
        email,
        password,
        direccion,
        fecha_nacimiento,
        id_rol: id_rol || 3,
        id_tipo_identificacion: 1,
        numero_identificacion,
        email_verified: false,
        email_verification_code: codigoVerificacion,
        login_two_factor_code: null,
      };

      mockUsersDb.push(nuevoUsuario);

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado. Enviamos un codigo de verificacion a tu correo.',
        requiresVerification: true,
      });
    });


    //verificar el correo con un código de confirmación
    app.post('/api/auth/verify-email', (req, res) => {
      const { email, code } = req.body;
      const usuario = mockUsersDb.find((user) => user.email === email);

      if (!usuario) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      if (usuario.email_verification_code !== code) {
        return res.status(400).json({ success: false, message: 'Código de verificación incorrecto.' });
      }

      usuario.email_verified = true;
      usuario.email_verification_code = null;

      return res.status(200).json({
        success: true,
        message: 'El correo ha sido verificado exitosamente.',
      });
    });

    // 3) Ruta para iniciar sesión y decidir si el flujo requiere verificación adicional
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      const usuario = mockUsersDb.find((user) => user.email === email);

      if (!usuario || usuario.password !== password) {
        return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
      }

      if (!usuario.email_verified) {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Debes verificar tu correo antes de iniciar sesion.',
        });
      }


      // Si el usuario es administrador o empleado, exige 2FA
      if (usuario.id_rol === 1 || usuario.id_rol === 2) {
        usuario.login_two_factor_code = '654321';
        return res.status(200).json({
          success: true,
          message: 'Enviamos un codigo de segundo factor a tu correo para completar el inicio de sesion.',
          requiresTwoFactor: true,
          pendingToken: pendingTokenAdmin,
          twoFactorExpiresInMinutes: 15,
          user: { id: usuario.id, email: usuario.email, id_rol: usuario.id_rol, rol: 'Administrador' },
        });
      }


      // Si es cliente entrega token
      res.cookie('access_token', tokenCliente, { httpOnly: true });
      return res.status(200).json({
        success: true,
        message: 'Inicio de sesion exitoso',
        token: tokenCliente,
        user: { id: usuario.id, email: usuario.email, id_rol: usuario.id_rol },
      });
    });


    //código de segundo factor
    app.post('/api/auth/verify-login-code', (req, res) => {
      const { pendingToken, code } = req.body;

      if (pendingToken !== pendingTokenAdmin) {
        return res.status(401).json({ success: false, message: 'Token pendiente inválido' });
      }

      const admin = mockUsersDb.find((user) => user.id_rol === 1);

      if (!admin || admin.login_two_factor_code !== code) {
        return res.status(400).json({ success: false, message: 'Codigo de segundo factor incorrecto.' });
      }

      admin.login_two_factor_code = null;
      res.cookie('access_token', tokenAdmin, { httpOnly: true });

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesion exitoso',
        token: tokenAdmin,
        user: { id: admin.id, email: admin.email, id_rol: admin.id_rol, rol: 'Administrador' },
      });
    });
  });


  //Limpia e inicia de nuevo otra prueba
  beforeEach(() => {
    mockUsersDb = [
      {
        id: 1,
        nombre: 'Admin',
        apellido: 'Mercapleno',
        email: 'admin@mercapleno.local',
        password: 'AdminPassword123!',
        direccion: 'Oficina Central',
        fecha_nacimiento: '1985-01-01',
        id_rol: 1,
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000001',
        email_verified: true,
        email_verification_code: null,
        login_two_factor_code: null,
      },
    ];
  });


  describe('Flujo de Cliente Común (Rol 3)', () => {


    it('debe registrar un nuevo cliente en estado no verificado y devolver 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Juan',
          apellido: 'Perez',
          email: 'juan.perez@example.com',
          password: 'Password123!',
          direccion: 'Calle Falsa 123',
          fecha_nacimiento: '1995-10-15',
          id_rol: 3,
          numero_identificacion: '12345678',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.requiresVerification).toBe(true);

      const usuarioGuardado = mockUsersDb.find((user) => user.email === 'juan.perez@example.com');
      expect(usuarioGuardado).toBeDefined();
      expect(usuarioGuardado.email_verified).toBe(false);
    });


    it('debe rechazar el login cuando el correo aún no ha sido verificado', async () => {
      mockUsersDb.push(createUser());

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'juan.perez@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });


    it('debe rechazar el login cuando las credenciales son incorrectas', async () => {
      mockUsersDb.push(createUser({ email_verified: true }));

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'juan.perez@example.com',
          password: 'PasswordIncorrecta!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Credenciales incorrectas');
    });


    it('debe verificar el correo cuando el código enviado es correcto', async () => {
      mockUsersDb.push(createUser({ email_verification_code: '123456' }));

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'juan.perez@example.com',
          code: '123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const usuarioGuardado = mockUsersDb.find((user) => user.email === 'juan.perez@example.com');
      expect(usuarioGuardado.email_verified).toBe(true);
    });


    it('debe rechazar la verificación de correo cuando el código es incorrecto', async () => {
      mockUsersDb.push(createUser({ email_verification_code: '123456' }));

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'juan.perez@example.com',
          code: '000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Código de verificación incorrecto.');
    });


    it('debe iniciar sesión correctamente cuando el usuario ya está verificado y devolver la cookie', async () => {
      mockUsersDb.push(createUser({ email_verified: true }));

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'juan.perez@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe(tokenCliente);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie) => cookie.includes('access_token'))).toBe(true);
    });
  });

  describe('Flujo de Administrador con 2FA (Rol 1)', () => {
    
    
    it('debe exigir código de segundo factor y completar el login cuando se valida correctamente', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@mercapleno.local',
          password: 'AdminPassword123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.requiresTwoFactor).toBe(true);
      expect(loginRes.body.pendingToken).toBe(pendingTokenAdmin);

      const verifyRes = await request(app)
        .post('/api/auth/verify-login-code')
        .send({
          pendingToken: pendingTokenAdmin,
          code: '654321',
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.token).toBe(tokenAdmin);

      const cookies = verifyRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie) => cookie.includes('access_token'))).toBe(true);
    });
  });
});
