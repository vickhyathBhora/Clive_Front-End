/**
 * Email Validation:
 * Checks empty, unsafe characters, and format.
 * Returns ONE fixed error message if any check fails.
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return 'Please enter a valid email address';
  }

  const clean = email.trim();
  const hasUnsafeChars = /['";<>\\]/.test(clean);
  const isValidFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);

  if (hasUnsafeChars || !isValidFormat) {
    return 'Please enter a valid email address';
  }

  return '';
};

/**
 * Phone Validation:
 * Checks empty, digits only, and 10-digit Indian mobile number format.
 * Returns ONE fixed error message if any check fails.
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return 'Please enter a valid 10-digit phone number';
  }

  const clean = phone.trim();
  const isValidIndianPhone = /^[6-9]\d{9}$/.test(clean);

  if (!isValidIndianPhone) {
    return 'Please enter a valid 10-digit phone number';
  }

  return '';
};

/**
 * Password Validation:
 * Checks length (min 6), at least 1 number, and at least 1 special character.
 * Returns ONE fixed error message if any check fails.
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Password must be at least 6 characters with 1 number & 1 special character';
  }

  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]]/.test(password);

  if (!hasMinLength || !hasNumber || !hasSpecialChar) {
    return 'Password must be at least 6 characters with 1 number & 1 special character';
  }

  return '';
};

/**
 * Confirm Password Validation:
 * Checks empty and matching passwords.
 * Returns ONE fixed error message if any check fails.
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return '';
};