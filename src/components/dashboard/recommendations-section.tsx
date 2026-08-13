import Link from "next/link";
import { AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recommendation } from "@/actions/performance";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

const PRIORITY_ICONS = {
  high: <AlertCircle className="h-5 w-5 text-red-600" />,
  medium: <TrendingUp className="h-5 w-5 text-yellow-600" />,
  low: <Lightbulb className="h-5 w-5 text-blue-600" />,
} as const;

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="border-white/70 bg-white/95 shadow-brand">
        <CardHeader>
          <CardTitle className="text-navy">Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            ¡Vas muy bien! No hay acciones urgentes en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader>
        <CardTitle className="text-navy">Recomendaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex gap-3 rounded-lg border border-cream-dark bg-cream/50 p-4"
            >
              <div className="flex-shrink-0 pt-0.5">{PRIORITY_ICONS[rec.priority]}</div>
              <div className="flex-1">
                <p className="text-sm text-navy">{rec.text}</p>
                <Link href={rec.deepLink}>
                  <button className="mt-2 text-xs font-medium text-blue-600 hover:underline">
                    Ver detalles →
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
