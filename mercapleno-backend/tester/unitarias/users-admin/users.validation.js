/* Es una funcion para validar datos (es parecido a un dto)*/
function validateUser(user) {
  const errors = [];

  if (!user.nombre) {
    errors.push('El nombre es obligatorio'); // agrega ese mensaje al arreglo (.push agrega / final)
  } else if (typeof user.nombre !== 'string') {
    errors.push('El nombre debe ser un texto');
  } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(user.nombre)) {
    errors.push('El nombre solo puede contener letras');
  }


  if (!user.apellido) {
    errors.push('El apellido es obligatorio');
  } else if (typeof user.apellido !== 'string') {
    errors.push('El apellido debe ser un texto');
  } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(user.apellido)) {
    errors.push('El apellido solo puede contener letras');
  }


  if (!user.email) {
    errors.push('El email es obligatorio');
  } else if (typeof user.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('El correo electrónico no es válido');
  }


  if (!user.password) {
    errors.push('La contraseña es obligatoria');
  } else if (typeof user.password !== 'string') {
    errors.push('La contraseña debe ser un texto');
  }


  if (!user.direccion) {
    errors.push('La dirección es obligatoria');
  } else if (typeof user.direccion !== 'string') {
    errors.push('La dirección debe ser un texto');
  }


  if (!user.fecha_nacimiento) {
    errors.push('La fecha de nacimiento es obligatoria');
  } else if (
    typeof user.fecha_nacimiento !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(user.fecha_nacimiento)
  ) {
    errors.push('La fecha de nacimiento debe tener el formato YYYY-MM-DD');
  }


  if (user.id_rol === undefined || user.id_rol === null) {
    errors.push('El rol es obligatorio');
  } else if (!Number.isInteger(user.id_rol)) {
    errors.push('El id del rol debe ser un número entero');
  }


  if (user.id_tipo_identificacion === undefined || user.id_tipo_identificacion === null) {
    errors.push('El tipo de identificación es obligatorio');
  } else if (!Number.isInteger(user.id_tipo_identificacion)) {
    errors.push('El tipo de identificación debe ser un número entero');
  }


  if (!user.numero_identificacion) {
    errors.push('El número de identificación es obligatorio');
  } else if (typeof user.numero_identificacion !== 'string') {
    errors.push('El número de identificación debe ser un texto');
  } else if (!/^\d+$/.test(user.numero_identificacion)) {
    errors.push('El número de identificación debe contener solo dígitos');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = { validateUser }; //exportar
