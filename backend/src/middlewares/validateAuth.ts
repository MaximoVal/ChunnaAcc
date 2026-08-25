import { Request, Response, NextFunction } from 'express';

// Expresión regular para validar formato de correo electrónico
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Middleware para asegurar la integridad de los datos en el Registro
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  let { name, email, password, phone, address, city, notes } = req.body;

  // Validación y sanitización de Nombre
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('El nombre es obligatorio y debe ser un texto válido.');
  } else {
    name = name.trim();
    if (name.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres.');
    } else if (name.length > 100) {
      errors.push('El nombre no puede exceder los 100 caracteres.');
    }
  }

  // Validación y sanitización de Email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio.');
  } else {
    email = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.push('El formato del correo electrónico no es válido.');
    } else if (email.length > 150) {
      errors.push('El correo electrónico no puede exceder los 150 caracteres.');
    }
  }

  // Validación de Contraseña
  if (!password || typeof password !== 'string') {
    errors.push('La contraseña es obligatoria.');
  } else if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres.');
  } else if (password.length > 128) {
    errors.push('La contraseña no puede exceder los 128 caracteres.');
  }

  // Validaciones opcionales para datos de comprador
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      errors.push('El teléfono debe ser un texto válido.');
    } else if (phone.trim().length > 50) {
      errors.push('El teléfono no puede exceder los 50 caracteres.');
    } else {
      phone = phone.trim();
    }
  }

  if (address !== undefined && address !== null) {
    if (typeof address !== 'string') {
      errors.push('La dirección debe ser un texto válido.');
    } else if (address.trim().length > 255) {
      errors.push('La dirección no puede exceder los 255 caracteres.');
    } else {
      address = address.trim();
    }
  }

  if (city !== undefined && city !== null) {
    if (typeof city !== 'string') {
      errors.push('La ciudad/localidad debe ser un texto válido.');
    } else if (city.trim().length > 100) {
      errors.push('La ciudad/localidad no puede exceder los 100 caracteres.');
    } else {
      city = city.trim();
    }
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Las notas deben ser un texto válido.');
    } else if (notes.trim().length > 1000) {
      errors.push('Las notas no pueden exceder los 1000 caracteres.');
    } else {
      notes = notes.trim();
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Error de validación de datos en el registro.',
      errors
    });
    return;
  }

  // Inyectar datos limpios y sanitizados en el body
  req.body = {
    name,
    email,
    password,
    phone: phone ? phone : null,
    address: address ? address : null,
    city: city ? city : null,
    notes: notes ? notes : null
  };

  next();
};

/**
 * Middleware para asegurar la integridad de los datos en el Login
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  let { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio.');
  } else {
    email = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.push('El formato del correo electrónico no es válido.');
    }
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errors.push('La contraseña es obligatoria.');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Datos de inicio de sesión incompletos o inválidos.',
      errors
    });
    return;
  }

  req.body = {
    email,
    password
  };

  next();
};

/**
 * Middleware para validar la integridad de la actualización de perfil
 */
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  let { name, phone, address, city, notes } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('El nombre no puede estar vacío.');
    } else {
      name = name.trim();
      if (name.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres.');
      } else if (name.length > 100) {
        errors.push('El nombre no puede superar los 100 caracteres.');
      }
    }
  }

  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      errors.push('El teléfono debe ser un texto.');
    } else {
      phone = phone.trim();
      if (phone.length > 50) {
        errors.push('El teléfono no puede superar los 50 caracteres.');
      }
    }
  }

  if (address !== undefined && address !== null) {
    if (typeof address !== 'string') {
      errors.push('La dirección debe ser un texto.');
    } else {
      address = address.trim();
      if (address.length > 255) {
        errors.push('La dirección no puede superar los 255 caracteres.');
      }
    }
  }

  if (city !== undefined && city !== null) {
    if (typeof city !== 'string') {
      errors.push('La ciudad debe ser un texto.');
    } else {
      city = city.trim();
      if (city.length > 100) {
        errors.push('La ciudad no puede superar los 100 caracteres.');
      }
    }
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Las notas deben ser un texto.');
    } else {
      notes = notes.trim();
      if (notes.length > 1000) {
        errors.push('Las notas no pueden superar los 1000 caracteres.');
      }
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Error de validación al actualizar el perfil.',
      errors
    });
    return;
  }

  // Filtrar solo los campos permitidos
  req.body = {
    name,
    phone: phone !== undefined ? (phone ? phone : null) : undefined,
    address: address !== undefined ? (address ? address : null) : undefined,
    city: city !== undefined ? (city ? city : null) : undefined,
    notes: notes !== undefined ? (notes ? notes : null) : undefined
  };

  next();
};
