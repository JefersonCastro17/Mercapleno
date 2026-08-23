const request = require('supertest'); //simula peticiones HTTP
const express = require('express');

describe('Pruebas de Integración - Mock API CRUD de Usuarios y Autenticación', () => {
  let app;

  let adminToken = 'mock-admin-jwt-token-xyz'; 
  let createdUserId = 42;                      
  const testUserEmail = 'pedro.picapiedra@example.com'; 
  const testUserNumId = '1234567890';          


  // Simulamos la tabla de usuarios del backend (mock)
  let mockUsersDb = [
    {
      id: 1,
      nombre: 'Admin',
      apellido: 'Mercapleno',
      email: 'admin@mercapleno.local',
      direccion: 'Panel administrativo',
      fecha_nacimiento: '1990-01-01',
      id_rol: 1, // Rol de Administrador
      id_tipo_identificacion: 1,
      numero_identificacion: '1000000001',
      email_verified: true,
    }
  ];

  beforeAll(() => {
    app = express();
    app.use(express.json());

        // simula un login
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Faltan credenciales' });
      }

      // Si las credenciales coinciden con el administrador, simulamos la respuesta de segundo factor
      if (email === 'admin@mercapleno.local' && password === 'Admin123*') {
        return res.json({
          success: true,
          message: 'Enviamos un codigo de segundo factor a tu correo para completar el inicio de sesion.',
          requiresTwoFactor: true,
          pendingToken: 'mock-pending-token-123', // Token temporal 
          twoFactorExpiresInMinutes: 10,
        });
      }

      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    });

    //valida el segundo factor
    app.post('/api/auth/verify-login-code', (req, res) => {
      const { pendingToken, code } = req.body;
      
      if (pendingToken === 'mock-pending-token-123' && code === '123456') {
        return res.json({
          success: true,
          message: 'Inicio de sesion exitoso',
          token: adminToken, // Entregamos el token JWT final con acceso completo
          user: {
            id: 1,
            email: 'admin@mercapleno.local',
            id_rol: 1,
            rol: 'Administrador',
          }
        });
      }

      return res.status(400).json({ success: false, message: 'Código de segundo factor inválido o expirado' });
    });

      //valida el token y permisos
    const checkMockAuth = (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No autorizado o token ausente' });
      }

      if (authHeader === 'Bearer mock-cliente-jwt-token-abc') {
        return res.status(403).json({ success: false, message: 'Forbidden resource' });
      }

      if (authHeader !== `Bearer ${adminToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado o token ausente' });
      }
      next(); // Si el token es correcto, permite avanzar al siguiente paso
    };

    //R - listar usuarios con soporte de búsqueda
    app.get('/api/admin/users', checkMockAuth, (req, res) => {
      const search = req.query.search;
      if (search) {
        const cleanSearch = search.trim().toLowerCase();
        const filtered = mockUsersDb.filter((u) => {
          const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
          const email = (u.email || '').toLowerCase();
          const doc = (u.numero_identificacion || '').toLowerCase();
          const rol = (u.id_rol === 1 ? 'administrador' : u.id_rol === 2 ? 'empleado' : 'cliente');
          return (
            nombreCompleto.includes(cleanSearch) ||
            email.includes(cleanSearch) ||
            doc.includes(cleanSearch) ||
            rol.includes(cleanSearch)
          );
        });
        return res.json(filtered);
      }
      res.json(mockUsersDb);
    });


    app.get('/api/admin/users/roles', checkMockAuth, (req, res) => {
      return res.json({
        success: true,
        roles: [
          { id: 1, nombre: 'Administrador' },
          { id: 2, nombre: 'Empleado' },
          { id: 3, nombre: 'Cliente' },
        ],
      });
    });

    // R - consultar usuario específico por ID
    app.get('/api/admin/users/:id', checkMockAuth, (req, res) => {
      const userId = Number(req.params.id);
      const user = mockUsersDb.find((u) => u.id === userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      return res.json({ success: true, usuario: user });
    });

    // C - crear con validación de duplicados
    app.post('/api/admin/users', checkMockAuth, (req, res) => {
      const { nombre, apellido, email, password, direccion, fecha_nacimiento, id_rol, id_tipo_identificacion, numero_identificacion } = req.body;
      
      // Validación para campos vacios
      if (!nombre || !apellido || !email || !password || !direccion || !fecha_nacimiento || !id_rol || !id_tipo_identificacion || !numero_identificacion) {
        return res.status(400).json({ success: false, message: 'Campos obligatorios faltantes' });
      }

      // Validar duplicado de email
      if (mockUsersDb.some((u) => u.email === email)) {
        return res.status(409).json({ success: false, message: 'El correo electronico ya esta registrado.' });
      }

      // Validar duplicado de identificación
      if (mockUsersDb.some((u) => u.numero_identificacion === numero_identificacion)) {
        return res.status(409).json({ success: false, message: 'El numero de identificacion ya esta registrado.' });
      }

      const newUser = {
        id: createdUserId,
        nombre,
        apellido,
        email,
        direccion,
        fecha_nacimiento,
        id_rol,
        id_tipo_identificacion,
        numero_identificacion,
        email_verified: true,
      };

      mockUsersDb.push(newUser); // Se guarda en el arreglo
      res.status(201).json(newUser);
    });

    //U - actualizar con validación de duplicados
    app.patch('/api/admin/users/:id', checkMockAuth, (req, res) => {
      const userId = Number(req.params.id);
      const userIndex = mockUsersDb.findIndex(u => u.id === userId);  //findIndex busca la posición del usuario en el arreglo
      
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      const { email, numero_identificacion } = req.body;

      // Validar duplicado de email (excluyendo al usuario editado)
      if (email !== undefined && mockUsersDb.some((u) => u.email === email && u.id !== userId)) {
        return res.status(409).json({ success: false, message: 'El correo electronico ya esta registrado.' });
      }

      // Validar duplicado de identificación (excluyendo al usuario editado)
      if (numero_identificacion !== undefined && mockUsersDb.some((u) => u.numero_identificacion === numero_identificacion && u.id !== userId)) {
        return res.status(409).json({ success: false, message: 'El numero de identificacion ya esta registrado.' });
      }

      // Mezclamos la información actual con la nueva información enviada
      const updatedUser = {
        ...mockUsersDb[userIndex],
        ...req.body
      };

      mockUsersDb[userIndex] = updatedUser; // Guardamos en memoria
      res.json(updatedUser);
    });

    // D - eliminar con control de integridad
    app.delete('/api/admin/users/:id', checkMockAuth, (req, res) => {
      const userId = Number(req.params.id);
      const userIndex = mockUsersDb.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      // Simulamos que el usuario 99 tiene compras o ventas asociadas y no se puede borrar
      if (userId === 99) {
        return res.status(409).json({ success: false, message: 'No se puede eliminar el usuario porque tiene registros asociados' });
      }

      mockUsersDb.splice(userIndex, 1); // Remueve el elemento del arreglo en memoria
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    });
  });


      //Aca inicia las pruebas de integracion

  describe('Flujo de Autenticación y Obtención de Token Admin (2FA)', () => {
    
    it('debe solicitar el código de segundo factor para el administrador', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@mercapleno.local',
          password: 'Admin123*',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requiresTwoFactor).toBe(true);
      expect(res.body.pendingToken).toBeDefined();

      const pendingToken = res.body.pendingToken;


      const verifyRes = await request(app)
        .post('/api/auth/verify-login-code')
        .send({
          pendingToken,
          code: '123456',
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.token).toBe(adminToken);
    });
  });


  



  describe('Flujo CRUD de Usuarios Administrativos (Rutas Protegidas)', () => {
    
    it('debe denegar el acceso a listar usuarios si no se envía token', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401); //usuario no valido
    });

    it('debe listar los usuarios cuando el token de administrador es válido', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1); //solo está el administrador inicial
    });

    it('debe listar los roles disponibles para el CRUD de usuarios', async () => {
      const res = await request(app)
        .get('/api/admin/users/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.roles)).toBe(true);
      expect(res.body.roles.length).toBeGreaterThan(0);
    });

    it('debe consultar un usuario específico por ID', async () => {
      const res = await request(app)
        .get('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.id).toBe(1);
    });

    it('debe crear un nuevo usuario administrativo', async () => {
      const newUserPayload = {
        nombre: 'Pedro',
        apellido: 'Picapiedra',
        email: testUserEmail,
        password: 'SecurePass123!',
        direccion: 'Piedradura 456',
        fecha_nacimiento: '1985-08-20',
        id_rol: 2, // Rol Empleado
        id_tipo_identificacion: 1,
        numero_identificacion: testUserNumId,
      };

      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserPayload);

      expect(res.status).toBe(201);
      expect(res.body.email).toBe(testUserEmail);
      expect(res.body.id).toBe(createdUserId);
    });

    it('debe actualizar los datos del usuario creado', async () => {
      // Campos a modificar
      const updatePayload = {
        nombre: 'Pedro Modificado',
        direccion: 'Nueva Cantera 789',
      };

      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe('Pedro Modificado');
      expect(res.body.direccion).toBe('Nueva Cantera 789');
    });


    it('debe eliminar el usuario administrativo creado', async () => {

      const res = await request(app)
        .delete(`/api/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);


      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);


      const checkRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const userExists = checkRes.body.some((user) => user.id === createdUserId);
      expect(userExists).toBe(false); // No debe existir en el listado
    });

    // --- NUEVAS PRUEBAS DE INTEGRACIÓN ADICIONALES (ÉPICA 2) ---

    // RF-002.1 / HU-002.1: Registro de Usuarios por Administrador
    it('debe denegar el registro si el correo electrónico ya está registrado (CP-003)', async () => {
      const duplicateEmailPayload = {
        nombre: 'Pablo',
        apellido: 'Marmol',
        email: 'admin@mercapleno.local', // Email del admin inicial
        password: 'Password123!',
        direccion: 'Piedradura 111',
        fecha_nacimiento: '1988-03-12',
        id_rol: 2,
        id_tipo_identificacion: 1,
        numero_identificacion: '9999999999',
      };

      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateEmailPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('El correo electronico ya esta registrado.');
    });

    it('debe denegar el registro si el número de identificación ya está registrado (CP-002)', async () => {
      const duplicateDocPayload = {
        nombre: 'Betty',
        apellido: 'Marmol',
        email: 'betty.marmol@example.com',
        password: 'Password123!',
        direccion: 'Piedradura 222',
        fecha_nacimiento: '1989-05-15',
        id_rol: 2,
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000001', // ID del admin inicial
      };

      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateDocPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('El numero de identificacion ya esta registrado.');
    });

    it('debe denegar el acceso a registrar usuarios si no es Administrador (CP-005)', async () => {
      const clientToken = 'mock-cliente-jwt-token-abc';
      const userPayload = {
        nombre: 'Pedro',
        apellido: 'Picapiedra',
        email: 'pedro@example.com',
        password: 'SecurePass123!',
        direccion: 'Piedradura 456',
        fecha_nacimiento: '1985-08-20',
        id_rol: 2,
        id_tipo_identificacion: 1,
        numero_identificacion: '55555555',
      };

      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(userPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    // RF-002.2 / HU-002.2: Consultar Usuarios
    it('debe filtrar la consulta de usuarios por nombre (CP-001)', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].email).toBe('admin@mercapleno.local');
    });

    it('debe filtrar la consulta de usuarios por número de identificación (CP-002)', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=1000000001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].nombre).toBe('Admin');
    });

    it('debe filtrar la consulta de usuarios por rol (CP-003)', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=administrador')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].nombre).toBe('Admin');
    });

    it('debe retornar lista vacía si la consulta no tiene resultados (CP-004)', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=UsuarioInexistente')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    // RF-002.3 / HU-002.3: Actualizar Usuario
    it('debe rechazar la edición si el correo electrónico ya está registrado por otro usuario (CP-003)', async () => {
      // Agregamos otro usuario temporal al mock db
      mockUsersDb.push({
        id: 5,
        nombre: 'Vilma',
        apellido: 'Picapiedra',
        email: 'vilma@example.com',
        direccion: 'Piedradura',
        fecha_nacimiento: '1987-04-04',
        id_rol: 2,
        id_tipo_identificacion: 1,
        numero_identificacion: '88888888',
      });

      // Intentamos actualizar al admin inicial (id: 1) con el email del otro usuario
      const res = await request(app)
        .patch('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'vilma@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('El correo electronico ya esta registrado.');
    });

    it('debe rechazar la edición si el número de identificación ya está registrado por otro usuario (CP-002)', async () => {
      // Intentamos actualizar al admin inicial (id: 1) con el documento del usuario temporal id: 5
      const res = await request(app)
        .patch('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ numero_identificacion: '88888888' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('El numero de identificacion ya esta registrado.');
    });

    it('debe denegar el acceso a actualizar usuarios si no es Administrador (CP-005)', async () => {
      const clientToken = 'mock-cliente-jwt-token-abc';
      const res = await request(app)
        .patch('/api/admin/users/1')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ nombre: 'Pedro Modificado' });

      expect(res.status).toBe(403);
    });

    // RF-002.4 / HU-002.4: Eliminar Usuario
    it('debe rechazar la eliminación si el usuario tiene compras o ventas asociadas (CP-002/CP-003)', async () => {
      // Agregamos un usuario con ID 99 (simulando compras/ventas vinculadas)
      mockUsersDb.push({
        id: 99,
        nombre: 'UsuarioHistorial',
        apellido: 'Picapiedra',
        email: 'historial@example.com',
        direccion: 'Piedradura',
        fecha_nacimiento: '1987-04-04',
        id_rol: 2,
        id_tipo_identificacion: 1,
        numero_identificacion: '77777777',
      });

      const res = await request(app)
        .delete('/api/admin/users/99')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No se puede eliminar el usuario porque tiene registros asociados');
    });

    it('debe denegar la eliminación si no es Administrador (CP-005)', async () => {
      const clientToken = 'mock-cliente-jwt-token-abc';
      const res = await request(app)
        .delete('/api/admin/users/5')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });
});
