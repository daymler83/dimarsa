import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PerformanceLevel = "green" | "amber" | "red";

interface PerformanceScoreProps {
  score: number;
  level: PerformanceLevel;
}

const LEVEL_STYLES = {
  green: {
    bg: "bg-green-50",
    icon: CheckCircle,
    iconColor: "text-green-600",
    text: "Excelente desempeño",
  },
  amber: {
    bg: "bg-yellow-50",
    icon: AlertCircle,
    iconColor: "text-yellow-600",
    text: "Hay margen para mejorar",
  },
  red: {
    bg: "bg-red-50",
    icon: XCircle,
    iconColor: "text-red-600",
    text: "Necesitas mejorar urgentemente",
  },
} as const;

export function PerformanceScore({ score, level }: PerformanceScoreProps) {
  const styles = LEVEL_STYLES[level];
  const Icon = styles.icon;

  return (
    <Card className={`border-white/70 shadow-brand ${styles.bg}`}>
      <CardHeader>
        <CardTitle className="text-navy">Tu desempeño esta semana</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="text-5xl font-bold text-navy">{score.toFixed(0)}/100</div>
        <Icon className={`h-12 w-12 ${styles.iconColor}`} />
        <p className="text-sm text-muted-foreground">{styles.text}</p>
      </CardContent>
    </Card>
  );
}
