/** Invite codes are 12 characters: digits and the letters A-F. */
export const INVITE_CODE_LENGTH = 12;

/** "A1B2C3D4E5F6" -> "A1B2-C3D4-E5F6", easier to read out and retype. */
export function formatInviteCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

/**
 * Whatever the user typed -> the stored form: no dashes or spaces, upper
 * case. The join_household function in the database does the same.
 */
export function normalizeInviteCode(input: string): string {
  return input.replace(/[^0-9a-z]/gi, "").toUpperCase();
}

/** True when the typed text can be a code at all (checked before sending). */
export function isPlausibleInviteCode(input: string): boolean {
  return /^[0-9A-F]{12}$/.test(normalizeInviteCode(input));
}
