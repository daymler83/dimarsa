import "server-only";

import { cookies } from "next/headers";

const DIMARZA_REF_COOKIE = "dimarza_ref";

export function getSellerCodeFromCookies(): string | null {
  return cookies().get(DIMARZA_REF_COOKIE)?.value ?? null;
}
