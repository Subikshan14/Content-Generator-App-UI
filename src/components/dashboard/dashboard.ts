import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CgSidebarComponent } from '../cg-sidebar-component/cg-sidebar-component';

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

  isExpanded = false;
  prompt = '';
  generatedContent = signal('');
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

  generateContent(): void {
    const prompt = this.prompt.trim();
    if (!prompt || this.isGenerating()) return;

    this.isGenerating.set(true);
    this.errorMessage.set('');
    this.generatedContent.set('');

    this.http.post<unknown>(`${this.apiBaseUrl()}/generate`, { prompt }).subscribe({
      next: (result) => {
        this.generatedContent.set(this.extractGeneratedContent(result));
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
