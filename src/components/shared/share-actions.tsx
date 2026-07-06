"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy, Facebook, Instagram, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ShareActionsProps = {
  sellerCode: string;
};

export function ShareActions({ sellerCode }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const [instagramCopied, setInstagramCopied] = useState(false);

  const catalogUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${sellerCode}`
      : `/c/${sellerCode}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Mira mi catalogo Dimarsa y compra directo aqui: ${catalogUrl}`,
  )}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(catalogUrl)}`;

  async function copyLink(onCopied: (value: boolean) => void) {
    await navigator.clipboard.writeText(catalogUrl);
    onCopied(true);
    setTimeout(() => onCopied(false), 2000);
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(catalogUrl)}`;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* QR + link: the primary action, given the most visual weight */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-cream-dark bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="shrink-0 rounded-2xl border border-cream-dark bg-white p-2 shadow-sm">
          <Image
            src={qrCodeUrl}
            alt={`Codigo QR de ${catalogUrl}`}
            width={168}
            height={168}
            unoptimized
            className="h-36 w-36 rounded-lg sm:h-[168px] sm:w-[168px]"
          />
        </div>

        <div className="flex w-full flex-1 flex-col gap-2 sm:gap-3">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-left">
            Tu link personalizado
          </p>
          <div className="flex items-center gap-2">
            <div className="min-h-11 flex-1 truncate rounded-full border border-cream-dark bg-cream/50 px-4 py-2.5 text-sm font-medium text-navy">
              <span className="block truncate">{catalogUrl}</span>
            </div>
            <Button
              type="button"
              onClick={() => copyLink(setCopied)}
              aria-label={copied ? "Link copiado" : "Copiar link"}
              className="h-11 w-11 shrink-0 rounded-full bg-navy p-0 text-white hover:bg-navy-light sm:w-auto sm:px-4"
            >
              {copied ? <Check className="h-4 w-4 sm:mr-2" /> : <Copy className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar link"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Share buttons: unified size, radius and icon+label layout, distinct brand colors */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          asChild
          className="h-11 justify-center gap-2 rounded-full bg-success text-sm text-white hover:bg-success/90"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span>WhatsApp</span>
          </a>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => copyLink(setInstagramCopied)}
          className="h-11 justify-center gap-2 rounded-full border-navy/20 text-sm text-navy hover:bg-cream"
        >
          <Instagram className="h-4 w-4 shrink-0" />
          <span>{instagramCopied ? "Copiado" : "Instagram"}</span>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-11 justify-center gap-2 rounded-full border-navy/20 text-sm text-navy hover:bg-cream"
        >
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
            <Facebook className="h-4 w-4 shrink-0" />
            <span>Facebook</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
