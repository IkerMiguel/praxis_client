/**
 * Política institucional de contraseñas (HU-1.4). Replica en el cliente las reglas que el backend
 * valida con `Password::min(8)->mixedCase()->numbers()->symbols()`; el backend sigue siendo la fuente de verdad.
 */
export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => [...p].length >= 8 },
  { id: 'upper', label: 'Una letra mayúscula', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'lower', label: 'Una letra minúscula', test: (p) => /\p{Ll}/u.test(p) },
  { id: 'number', label: 'Un número', test: (p) => /\p{N}/u.test(p) },
  { id: 'symbol', label: 'Un símbolo, como ! @ # $', test: (p) => /[\p{Z}\p{S}\p{P}]/u.test(p) },
];

export function passedRules(password: string): Set<string> {
  return new Set(PASSWORD_RULES.filter((rule) => rule.test(password)).map((rule) => rule.id));
}

export function meetsPolicy(password: string): boolean {
  return passedRules(password).size === PASSWORD_RULES.length;
}
