export const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
export const NAME_VALIDATION_MESSAGE = 'Solo puede contener letras y espacios';

export const DOCUMENT_REGEX = /^\d+$/;
export const DOCUMENT_VALIDATION_MESSAGE = 'El número de identificación debe contener solo dígitos';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_LOWERCASE_REGEX = /^(?=.*[a-z])/;
export const PASSWORD_UPPERCASE_REGEX = /^(?=.*[A-Z])/;
export const PASSWORD_NUMBER_REGEX = /^(?=.*\d)/;
export const PASSWORD_SPECIAL_CHAR_REGEX = /^(?=.*[@$!%*?&])/;

export const PASSWORD_MESSAGES = {
  MIN_LENGTH: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  LOWERCASE: 'La contraseña debe contener al menos una letra minúscula',
  UPPERCASE: 'La contraseña debe contener al menos una letra mayúscula',
  NUMBER: 'La contraseña debe contener al menos un número',
  SPECIAL_CHAR: 'La contraseña debe contener al menos un carácter especial (@$!%*?&)',
};
