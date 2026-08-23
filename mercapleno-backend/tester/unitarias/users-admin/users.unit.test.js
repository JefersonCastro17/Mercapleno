// Importamos la función de validación que vamos a probar
const { validateUser } = require('../users-admin/users.validation');


describe('Pruebas Unitarias - Validación del Registro de Usuarios', () => {
  let validUser;
  // beforeEach: se ejecuta antes de cada prueba para inicializar un objeto limpio
  beforeEach(() => {
    validUser = {
      nombre: 'Juan Carlos',
      apellido: 'Perez Gomez',
      email: 'juan.perez@example.com',
      password: 'SecurePass123!',
      direccion: 'Calle Falsa 123',
      fecha_nacimiento: '1990-05-15',
      id_rol: 3,
      id_tipo_identificacion: 1,
      numero_identificacion: '123456789',
    };
  });


  // Prueba para el caso exitoso (Campos válidos)
  it('debe pasar la validación con un usuario totalmente válido', () => {
    const result = validateUser(validUser);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });


  // CP-052
  it('debe fallar si faltan campos obligatorios en el objeto', () => {
    delete validUser.nombre;
    delete validUser.email;
    delete validUser.password;
    const result = validateUser(validUser);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El nombre es obligatorio');
    expect(result.errors).toContain('El email es obligatorio');
    expect(result.errors).toContain('La contraseña es obligatoria');
  });


  it('debe fallar si el nombre contiene números u otros caracteres que no sean letras', () => {
    validUser.nombre = 'Juan123';
    const result = validateUser(validUser);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El nombre solo puede contener letras');
  });


  // Prueba de formato de correo electrónico
  it('debe fallar si el formato del email es incorrecto', () => {
    validUser.email = 'juan.perez.com'; // Formato sin '@'
    const result = validateUser(validUser);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El correo electrónico no es válido');
  });


  it('debe fallar si el formato de la fecha de nacimiento no es YYYY-MM-DD', () => {
    validUser.fecha_nacimiento = '15-05-1990'; // Formato DD-MM-YYYY incorrecto
    const result = validateUser(validUser);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('La fecha de nacimiento debe tener el formato YYYY-MM-DD');
  });


  it('debe fallar si el número de identificación contiene letras', () => {
    validUser.numero_identificacion = '12345ABC'; // Contiene letras
    const result = validateUser(validUser);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El número de identificación debe contener solo dígitos');
  });


  it('debe fallar si el id_rol o id_tipo_identificacion no son números enteros', () => {
    validUser.id_rol = 3.5; // Decimal no permitido
    validUser.id_tipo_identificacion = '1'; // String no permitido
    
    const result = validateUser(validUser);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El id del rol debe ser un número entero');
    expect(result.errors).toContain('El tipo de identificación debe ser un número entero');
  });
});