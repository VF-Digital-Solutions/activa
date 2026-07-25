import Link from "next/link";
import { ASSESSMENT_SLUG_BY_TYPE, ASSESSMENT_TYPE_LABEL } from "@/lib/assessment";

const ASSESSMENT_DESCRIPTIONS: Record<string, string> = {
  AUDIT_7_AREAS:
    "Diagnóstico rápido del patrimonio existencial: una pregunta por cada uno de los siete capitales.",
  HEALTH_SCALE_10:
    "Diez indicadores de salud existencial, cada uno con su propia pregunta diagnóstica.",
};

export default function AssessmentPage() {
  const types = Object.keys(ASSESSMENT_SLUG_BY_TYPE) as Array<
    keyof typeof ASSESSMENT_SLUG_BY_TYPE
  >;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Evaluación existencial</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          Un retrato de tu patrimonio existencial hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((type) => (
          <Link
            key={type}
            href={`/assessment/${ASSESSMENT_SLUG_BY_TYPE[type]}`}
            className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 hover:border-[#C8A96B]/40 transition-colors group"
          >
            <h3 className="text-lg font-semibold text-[#EAE6DD] group-hover:text-[#C8A96B] transition-colors">
              {ASSESSMENT_TYPE_LABEL[type]}
            </h3>
            <p className="text-[#5A6A5A] text-sm mt-2">
              {ASSESSMENT_DESCRIPTIONS[type]}
            </p>
            <span className="inline-block mt-4 text-sm text-[#C8A96B]">
              Comenzar →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
