import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerDashboardPlaceholder() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">Panel de vendedor</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            El dashboard del vendedor se completara en los siguientes tasks. El flujo de auth ya redirige aqui.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
