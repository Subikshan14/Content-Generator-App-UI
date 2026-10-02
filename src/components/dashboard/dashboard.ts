import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CgSidebarComponent } from '../cg-sidebar-component/cg-sidebar-component';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface ChatSession {
  id: number;
  title: string;
  messages: ChatMessage[];
}

@Component({
  imports: [CgSidebarComponent, FormsModule],
  standalone: true,
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = signal('http://localhost:8000');
  private nextChatId = 2;

  isExpanded = false;
  prompt = '';
  readonly maxChats = 10;
  chats = signal<ChatSession[]>([{ id: 1, title: 'New chat', messages: [] }]);
  activeChatId = signal(1);
  activeChat = computed(() => this.chats().find((chat) => chat.id === this.activeChatId()));
  activeChatTitle = computed(() => this.activeChat()?.title ?? 'New chat');
  messages = computed(() => this.activeChat()?.messages ?? []);
  isGenerating = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.isExpanded = false;
    this.http.get<{ apiBaseUrl?: string }>('/env.json').subscribe({
      next: (config) => {
        const apiBaseUrl = config.apiBaseUrl?.trim();
        if (apiBaseUrl) this.apiBaseUrl.set(apiBaseUrl.replace(/\/+$/, ''));
      },
      error: () => undefined,
    });
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  createChat(): void {
    if (this.isGenerating() || this.chats().length >= this.maxChats) return;

    const id = this.nextChatId++;
    this.chats.update((chats) => [...chats, { id, title: 'New chat', messages: [] }]);
    this.activeChatId.set(id);
    this.prompt = '';
    this.errorMessage.set('');
  }

  selectChat(chatId: number): void {
    if (this.isGenerating() || !this.chats().some((chat) => chat.id === chatId)) return;

    this.activeChatId.set(chatId);
    this.prompt = '';
    this.errorMessage.set('');
  }

  updateDraftTitle(prompt: string): void {
    const title = prompt.trim() ? this.chatTitleFromPrompt(prompt) : 'New chat';
    const chatId = this.activeChatId();
    this.chats.update((chats) =>
      chats.map((chat) =>
        chat.id === chatId && chat.messages.length === 0 ? { ...chat, title } : chat,
      ),
    );
  }

  deleteChat(chatId: number): void {
    if (this.isGenerating()) return;

    const chats = this.chats();
    const deletedIndex = chats.findIndex((chat) => chat.id === chatId);
    if (deletedIndex === -1) return;

    if (chats.length === 1) {
      const replacement = { id: this.nextChatId++, title: 'New chat', messages: [] };
      this.chats.set([replacement]);
      this.activeChatId.set(replacement.id);
      this.prompt = '';
      this.errorMessage.set('');
      return;
    }

    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    this.chats.set(remainingChats);

    if (this.activeChatId() === chatId) {
      const nextChat = remainingChats[Math.min(deletedIndex, remainingChats.length - 1)];
      this.activeChatId.set(nextChat.id);
      this.prompt = '';
      this.errorMessage.set('');
    }
  }

  generateContent(): void {
    const prompt = this.prompt.trim();
    if (!prompt || this.isGenerating()) return;

    this.submitPrompt(prompt, this.activeChatId(), true);
  }

  retryLastPrompt(): void {
    if (this.isGenerating() || !this.errorMessage()) return;

    const lastMessage = this.messages().at(-1);
    if (!lastMessage || lastMessage.role !== 'user') return;

    this.submitPrompt(lastMessage.content, this.activeChatId(), false);
  }

  private submitPrompt(prompt: string, chatId: number, appendUserMessage: boolean): void {
    if (appendUserMessage) {
      this.chats.update((chats) =>
        chats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title: chat.title === 'New chat' ? this.chatTitleFromPrompt(prompt) : chat.title,
                messages: [...chat.messages, { role: 'user', content: prompt }],
              }
            : chat,
        ),
      );
    }

    this.prompt = '';
    this.isGenerating.set(true);
    this.errorMessage.set('');

    this.http.post<unknown>(`${this.apiBaseUrl()}/generate`, { prompt }).subscribe({
      next: (result) => {
        this.chats.update((chats) =>
          chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    { role: 'assistant', content: this.extractGeneratedContent(result) },
                  ],
                }
              : chat,
          ),
        );
        this.isGenerating.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Could not generate content. Check that the FastAPI server is running and that its /generate endpoint accepts this request.',
        );
        this.isGenerating.set(false);
      },
    });
  }

  private chatTitleFromPrompt(prompt: string): string {
    const title = prompt.replace(/\s+/g, ' ').trim();
    return title.length > 36 ? `${title.slice(0, 36).trimEnd()}...` : title;
  }

  private extractGeneratedContent(result: unknown): string {
    if (typeof result === 'string') return result;
    if (result && typeof result === 'object') {
      const response = result as Record<string, unknown>;
      for (const key of ['response', 'generated_text', 'text', 'content']) {
        if (typeof response[key] === 'string') return response[key];
      }
    }
    return 'The generation endpoint returned an unexpected response.';
  }
}
