function validateRegister(data = {}) {  //register
    const errors = [];

    const nombre = data.nombre ?? data.NOMBRE;
    const apellido = data.apellido ?? data.APELLIDO;
    const email = data.email ?? data.EMAIL;
    const password = data.password ?? data.PASSWORD;
    const direccion = data.direccion ?? data.dirección;
    const fechaNacimiento = data.fecha_nacimiento ?? data.fecha_nacimento;
    const idTipoIdentificacion = data.id_tipo_identificacion ?? data.id_tipo_identificación;
    const numeroIdentificacion = data.numero_identificacion ?? data.numero_identificación;


    if (!nombre) {
        errors.push('El nombre es obligatorio');
    } else if (typeof nombre !== 'string') {
        errors.push('El nombre debe ser un texto');
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
        errors.push('El nombre solo puede contener letras');
    }


    if (!apellido) {
        errors.push('El apellido es obligatorio');
    } else if (typeof apellido !== 'string') {
        errors.push('El apellido debe ser un texto');
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(apellido)) {
        errors.push('El apellido solo puede contener letras');
    }


    if (!email) {
        errors.push('El correo electrónico no es válido');
    } else if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('El correo electrónico no es válido');
    }


    if (!password) {
        errors.push('La contraseña es obligatoria');
    } else if (typeof password !== 'string') {
        errors.push('La contraseña debe ser un texto');
    } else {
        if (password.length < 12) {
            errors.push('La contraseña debe tener al menos 12 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('La contraseña debe contener al menos un número');
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
        }
    }


    if (!direccion) {
        errors.push('La dirección es obligatoria');
    } else if (typeof direccion !== 'string') {
        errors.push('La dirección debe ser un texto');
    }


    if (!fechaNacimiento) {
        errors.push('La fecha de nacimiento es obligatoria');
    } else if (typeof fechaNacimiento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
        errors.push('La fecha de nacimiento debe tener el formato YYYY-MM-DD');
    }


    if (idTipoIdentificacion === undefined || idTipoIdentificacion === null) {
        errors.push('El tipo de identificación es obligatorio');
    } else if (!Number.isInteger(idTipoIdentificacion)) {
        errors.push('El tipo de identificación debe ser un número entero');
    }


    if (!numeroIdentificacion) {
        errors.push('El número de identificación es obligatorio');
    } else if (typeof numeroIdentificacion !== 'string') {
        errors.push('El número de identificación debe ser un texto');
    } else if (!/^\d+$/.test(numeroIdentificacion)) {
        errors.push('El número de identificación debe contener solo dígitos');
    }


    return {
        isValid: errors.length === 0,
        errors,
    };
}

                                        //Login
function validateLogin(data = {}) {
    const errors = [];

    if (!data.email) {
        errors.push('El email es requerido');
    } else if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('El email no es válido');
    }

    if (!data.password) {
        errors.push('La contraseña es requerida');
    } else if (typeof data.password !== 'string') {
        errors.push('La contraseña debe ser un texto');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

                            //Validar email
function validateVerifyEmail(data = {}) {
    const errors = [];

    if (!data.email) {
        errors.push('El correo es obligatorio');
    } else if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('El correo electrónico no es válido');
    }

    if (!data.code) {
        errors.push('El código de verificación es obligatorio');
    } else if (typeof data.code !== 'string' || !/^\d{6}$/.test(data.code)) {
        errors.push('El código de verificación debe ser un texto de 6 dígitos');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

            //validar codigo
function validateVerifyLoginCode(data = {}) {
    const errors = [];

    if (!data.pendingToken) {
        errors.push('El token pendiente es obligatorio');
    } else if (typeof data.pendingToken !== 'string') {
        errors.push('El token pendiente debe ser un texto');
    }

    if (!data.code) {
        errors.push('El código de 2FA es obligatorio');
    } else if (typeof data.code !== 'string' || !/^\d{6}$/.test(data.code)) {
        errors.push('El código de 2FA debe ser un texto de 6 dígitos');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

function validateRequestPasswordReset(data = {}) {
    const errors = [];

    if (!data.email) {
        errors.push('El correo es obligatorio');
    } else if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('El correo electrónico no es válido');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

function validateResetPassword(data = {}) {
    const errors = [];

    const password = data.password ?? data.PASSWORD;

    if (!password) {
        errors.push('La nueva contraseña es obligatoria');
    } else if (typeof password !== 'string') {
        errors.push('La nueva contraseña debe ser un texto');
    } else {
        if (password.length < 12) {
            errors.push('La contraseña debe tener al menos 12 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('La contraseña debe contener al menos un número');
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

module.exports = {
    validateRegister,
    validateLogin,
    validateVerifyEmail,
    validateVerifyLoginCode,
    validateRequestPasswordReset,
    validateResetPassword,
};



