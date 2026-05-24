export type ChatRole = 'agent' | 'user';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  productCard?: ProductRecommendation;
}

export interface ProductRecommendation {
  nombre: string;
  tipo: 'credito' | 'ahorro' | 'inversion' | 'seguro' | 'tarjeta';
  descripcion: string;
  beneficios: string[];
  tasa?: string;
  cta: string;
}

export interface LeadProfile {
  edad?: number;
  ingresos?: number;
  necesidad?: string;
  esCliente?: boolean;
  scoreInteres?: number;
}
