export const AUTH_COOKIE = "finance_tracker_auth";

export function isAuthorizedCookie(value?: string) {
  return value === "1";
}
