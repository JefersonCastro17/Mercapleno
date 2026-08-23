import CryptoJS from 'crypto-js';

// Clave secreta - en producción debería venir del backend o env
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'mercapleno-secret-key-2026';

/**
 * Cifra un string usando AES
 * @param {string} text - Texto a cifrar
 * @returns {string} - Texto cifrado en Base64
 */
export const encryptToken = (text) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error al cifrar token:', error);
    return null;
  }
};

/**
 * Descifra un string cifrado con AES
 * @param {string} encryptedText - Texto cifrado
 * @returns {string} - Texto descifrado
 */
export const decryptToken = (encryptedText) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY).toString(
      CryptoJS.enc.Utf8
    );
    if (decrypted) {
      return decrypted;
    }

    // Si el valor no parece ser un texto cifrado AES, asumir que ya es un token JWT en texto plano.
    if (typeof encryptedText === 'string' && encryptedText.includes('.')) {
      return encryptedText;
    }

    return null;
  } catch (error) {
    console.error('Error al descifrar token:', error);
    if (typeof encryptedText === 'string' && encryptedText.includes('.')) {
      return encryptedText;
    }
    return null;
  }
};

/**
 * Cifra un objeto (lo convierte a JSON primero)
 * @param {object} obj - Objeto a cifrar
 * @returns {string} - JSON cifrado
 */
export const encryptData = (obj) => {
  try {
    const jsonString = JSON.stringify(obj);
    return encryptToken(jsonString);
  } catch (error) {
    console.error('Error al cifrar datos:', error);
    return null;
  }
};

/**
 * Descifra un objeto
 * @param {string} encryptedJson - JSON cifrado
 * @returns {object} - Objeto descifrado
 */
export const decryptData = (encryptedJson) => {
  try {
    const decryptedString = decryptToken(encryptedJson);
    if (decryptedString) {
      return JSON.parse(decryptedString);
    }

    // Si el valor no está cifrado pero es JSON válido,
    // devolver el objeto parseado directamente.
    if (typeof encryptedJson === 'string') {
      try {
        return JSON.parse(encryptedJson);
      } catch {
        // no es JSON válido en texto plano
      }
    }

    return null;
  } catch (error) {
    console.error('Error al descifrar datos:', error);
    if (typeof encryptedJson === 'string') {
      try {
        return JSON.parse(encryptedJson);
      } catch {
        // no es JSON válido en texto plano
      }
    }
    return null;
  }
};
