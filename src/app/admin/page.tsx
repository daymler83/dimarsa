import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPlaceholder() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">Panel de administración</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            El dashboard admin se implementará más adelante. El flujo de inicio de sesión ya contempla esta ruta.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
