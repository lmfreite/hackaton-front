import { ProductRecommendation } from '../core/models/advisor.model';

export interface ScriptedTurn {
  agentReply: string;
  quickReplies?: string[];
  recommend?: ProductRecommendation;
  capturedLead?: boolean;
}

/**
 * Conversational happy-path mock — the advisor profiles the user across a few
 * turns and ends with a personalized product recommendation.
 */
export const ADVISOR_SCRIPT: ScriptedTurn[] = [
  {
    agentReply:
      'Para recomendarte el producto adecuado necesito conocerte un poco. ¿Eres cliente de Serfinanza actualmente?',
    quickReplies: ['Sí, soy cliente', 'Aún no', 'Tengo otra cuenta'],
  },
  {
    agentReply:
      'Perfecto. ¿En qué rango de edad te encuentras? Esto me ayuda a sugerirte productos que se ajusten a tu momento de vida.',
    quickReplies: ['18 – 25', '26 – 35', '36 – 50', 'Más de 50'],
  },
  {
    agentReply:
      'Genial. ¿Cuál es tu ingreso mensual aproximado? Lo manejamos con total confidencialidad.',
    quickReplies: [
      'Menos de $2M',
      '$2M – $5M',
      '$5M – $10M',
      'Más de $10M',
    ],
  },
  {
    agentReply:
      '¿Cuál es la necesidad financiera principal que tienes en este momento?',
    quickReplies: [
      'Capital para mi negocio',
      'Comprar vivienda',
      'Ahorrar o invertir',
      'Crédito personal',
    ],
  },
  {
    agentReply:
      'Con base en lo que me cuentas, tengo una recomendación que se ajusta perfecto a tu perfil. Te dejo los detalles:',
    recommend: {
      nombre: 'Crédito Salvavidas Pyme',
      tipo: 'credito',
      descripcion:
        'Capital de trabajo pre-aprobado con desembolso en menos de 2 minutos en tu billetera Serfinanza.',
      beneficios: [
        'Aprobación inmediata según el comportamiento de tu negocio',
        'Tasa preferencial regulada por la Superfinanciera',
        'Plazos flexibles de 30, 45 o 60 días',
        'Cupo ajustado a temporada y ubicación de tu negocio',
      ],
      tasa: 'Desde 1.6% E.A.',
      cta: 'Activar mi cupo',
    },
  },
  {
    agentReply:
      '¿A qué número podemos contactarte para confirmar la activación y resolver cualquier duda?',
    quickReplies: ['Compartir mi celular', 'Prefiero correo', 'Más tarde'],
    capturedLead: true,
  },
];
