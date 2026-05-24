import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ChatMessage, LeadProfile } from '../models/advisor.model';
import { ADVISOR_SCRIPT, ScriptedTurn } from '../../mocks/advisor-script.mock';

@Injectable({ providedIn: 'root' })
export class AdvisorService {
  readonly messages = signal<ChatMessage[]>([]);
  readonly leadCaptured = signal<boolean>(false);
  readonly profile = signal<LeadProfile>({});
  private turnIndex = 0;

  greet(): void {
    if (this.messages().length > 0) return;
    this.appendAgent(
      '¡Hola! Soy tu Asesor Financiero Virtual de Serfinanza. Estoy aquí para ayudarte a encontrar el producto que mejor se ajusta a tus metas. ¿Empezamos?',
      ['Sí, comencemos', 'Cuéntame qué ofrecen'],
    );
  }

  sendUserMessage(content: string): Observable<ChatMessage> {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.messages.update((prev) => [...prev, userMsg]);

    const next: ScriptedTurn | undefined = ADVISOR_SCRIPT[this.turnIndex];
    this.turnIndex += 1;

    if (!next) {
      const closingMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'agent',
        content:
          '¡Listo! Un asesor humano se pondrá en contacto contigo para finalizar la activación. Gracias por confiar en Serfinanza.',
        timestamp: new Date(),
      };
      return of(closingMsg).pipe(delay(900));
    }

    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'agent',
      content: next.agentReply,
      timestamp: new Date(),
      quickReplies: next.quickReplies,
      productCard: next.recommend,
    };

    if (next.capturedLead) {
      this.leadCaptured.set(true);
    }

    return of(reply).pipe(delay(1100 + Math.random() * 600));
  }

  appendAgent(content: string, quickReplies?: string[]): void {
    this.messages.update((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'agent',
        content,
        timestamp: new Date(),
        quickReplies,
      },
    ]);
  }

  appendMessage(msg: ChatMessage): void {
    this.messages.update((prev) => [...prev, msg]);
  }

  reset(): void {
    this.messages.set([]);
    this.leadCaptured.set(false);
    this.profile.set({});
    this.turnIndex = 0;
    this.greet();
  }
}
