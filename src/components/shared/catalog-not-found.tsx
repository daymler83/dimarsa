import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CatalogNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="max-w-md border-white/70 bg-white/95 text-center shadow-brand">
        <CardHeader>
          <CardTitle className="text-navy">Catálogo no disponible</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Este link de vendedor no existe o ya no está activo. Pídele a tu vendedor un link
          actualizado.
        </CardContent>
      </Card>
    </main>
  );
}
