import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [MatIconModule],
  standalone: true,
  selector: 'app-cg-sidebar-component',
  styleUrl: './cg-sidebar-component.scss',
  templateUrl: './cg-sidebar-component.html',
})
export class CgSidebarComponent {
  @Output() menuToggle = new EventEmitter<void>();
  @Output() newChat = new EventEmitter<void>();
  @Output() chatSelected = new EventEmitter<number>();
  @Output() chatDeleted = new EventEmitter<number>();
  @Input() isExpanded = false;
  @Input() chats: { id: number; title: string }[] = [];
  @Input() activeChatId = 1;
  @Input() chatLimitReached = false;
  @Input() isBusy = false;

  onMenuClick(): void {
    this.menuToggle.emit();
  }

  onNewChat(): void {
    this.newChat.emit();
  }

  onChatSelected(chatId: number): void {
    this.chatSelected.emit(chatId);
  }

  onChatDeleted(chatId: number): void {
    this.chatDeleted.emit(chatId);
  }
}
