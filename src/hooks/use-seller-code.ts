"use client";

import { useEffect } from "react";

const DIMARZA_REF_COOKIE = "dimarza_ref";
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export function useSellerCode(sellerCode: string) {
  useEffect(() => {
    document.cookie = `${DIMARZA_REF_COOKIE}=${sellerCode};path=/;max-age=${THIRTY_DAYS_IN_SECONDS};SameSite=Lax`;
  }, [sellerCode]);
}
