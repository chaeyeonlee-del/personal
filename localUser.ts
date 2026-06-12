const guestUserPrefix = 'guest-';
const guestUserIdPattern = /^guest-[a-z0-9]{10,}$/;

export function createGuestUserId(random = Math.random) {
  const randomValue = Math.floor(random() * Number.MAX_SAFE_INTEGER)
    .toString(36)
    .padStart(10, '0');

  return `${guestUserPrefix}${randomValue}`;
}

export function isGuestUserId(value: unknown): value is string {
  return typeof value === 'string' && guestUserIdPattern.test(value);
}
