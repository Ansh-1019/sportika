export type LocalAuthValidationInput = {
  name?: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function localAuthValidationError(input: LocalAuthValidationInput, isSignup: boolean): string | null {
  if (isSignup && input.name?.trim().length !== undefined && (input.name.trim().length < 2 || input.name.trim().length > 80)) {
    return "Enter a name between 2 and 80 characters.";
  }
  if (!emailPattern.test(input.email.trim()) || input.email.trim().length > 320) {
    return "Enter a valid email address.";
  }
  if (input.password.length < 8 || input.password.length > 128) {
    return "Use a password between 8 and 128 characters.";
  }
  if (isSignup && input.password !== input.passwordConfirmation) {
    return "Passwords do not match.";
  }
  return null;
}
