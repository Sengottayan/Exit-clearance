const PLACEHOLDER_PUBLISHABLE = "pk_test_YOUR_CLERK_PUBLISHABLE_KEY";
const PLACEHOLDER_SECRET = "sk_test_YOUR_CLERK_SECRET_KEY";

export function isValidClerkPublishableKey(key: string | undefined): boolean {
  if (!key) return false;
  if (key === PLACEHOLDER_PUBLISHABLE) return false;
  return key.startsWith("pk_");
}

export function isValidClerkSecretKey(key: string | undefined): boolean {
  if (!key) return false;
  if (key === PLACEHOLDER_SECRET) return false;
  return key.startsWith("sk_");
}
