import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdvisorService } from '../../core/services/advisor.service';
import { ChatMessage } from '../../core/models/advisor.model';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { StatusChipComponent } from '../../shared/ui/status-chip/status-chip.component';

@Component({
  selector: 'app-advisor',
  standalone: true,
  imports: [FormsModule, CardComponent, ButtonComponent, IconComponent, StatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advisor.component.html',
  styleUrl: './advisor.component.scss',
})
export class AdvisorComponent implements OnInit, AfterViewChecked {
  private advisor = inject(AdvisorService);
  @ViewChild('scroller') scroller?: ElementRef<HTMLDivElement>;

  readonly messages = this.advisor.messages;
  readonly leadCaptured = this.advisor.leadCaptured;
  readonly typing = signal(false);
  readonly draft = signal('');

  private shouldScroll = true;

  ngOnInit(): void {
    this.advisor.greet();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scroller) {
      this.scroller.nativeElement.scrollTop = this.scroller.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  onSubmit(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.send(text);
    this.draft.set('');
  }

  selectQuickReply(text: string): void {
    this.send(text);
  }

  private send(text: string): void {
    this.shouldScroll = true;
    this.typing.set(true);
    this.advisor.sendUserMessage(text).subscribe((reply: ChatMessage) => {
      this.advisor.appendMessage(reply);
      this.typing.set(false);
      this.shouldScroll = true;
    });
  }

  reset(): void {
    this.advisor.reset();
    this.shouldScroll = true;
  }

  trackMsg(_: number, m: ChatMessage): string {
    return m.id;
  }
}
