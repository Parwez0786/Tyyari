export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,64}$/;

export function isValidEmail(value) {
  const email = String(value || "").trim();
  if (!email || email.length > 254 || email.includes("..")) return false;
  return EMAIL_PATTERN.test(email);
}
