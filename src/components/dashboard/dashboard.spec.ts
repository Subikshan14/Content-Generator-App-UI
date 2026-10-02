import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpTestingController.expectOne('/env.json').flush({});
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens a blank chat and keeps each chat history separate', () => {
    const firstChatId = component.activeChatId();
    component.chats.update((chats) =>
      chats.map((chat) =>
        chat.id === firstChatId
          ? {
              ...chat,
              title: 'First prompt',
              messages: [{ role: 'user', content: 'First prompt' }],
            }
          : chat,
      ),
    );

    component.createChat();
    const secondChatId = component.activeChatId();

    expect(component.activeChatTitle()).toBe('New chat');
    expect(component.messages()).toEqual([]);

    component.selectChat(firstChatId);
    expect(component.messages()).toEqual([{ role: 'user', content: 'First prompt' }]);

    component.selectChat(secondChatId);
    expect(component.messages()).toEqual([]);
  });

  it('uses the draft prompt as the new chat title', () => {
    component.updateDraftTitle('  Plan a product launch  ');
    expect(component.activeChatTitle()).toBe('Plan a product launch');

    component.updateDraftTitle('');
    expect(component.activeChatTitle()).toBe('New chat');
  });

  it('limits the chat stack to ten sessions', () => {
    for (let index = 0; index < 12; index++) {
      component.createChat();
    }

    expect(component.chats()).toHaveLength(10);
  });

  it('deletes chats and keeps a blank chat available when deleting the last one', () => {
    const firstChatId = component.activeChatId();
    component.createChat();
    const secondChatId = component.activeChatId();

    component.deleteChat(secondChatId);
    expect(component.activeChatId()).toBe(firstChatId);
    expect(component.chats()).toHaveLength(1);

    component.deleteChat(firstChatId);
    expect(component.chats()).toHaveLength(1);
    expect(component.activeChatId()).not.toBe(firstChatId);
    expect(component.activeChatTitle()).toBe('New chat');
  });

  it('allows a new chat after deleting one at the limit', () => {
    for (let index = 0; index < 9; index++) {
      component.createChat();
    }

    component.deleteChat(component.activeChatId());
    component.createChat();

    expect(component.chats()).toHaveLength(10);
  });

  it('retries the last failed prompt without adding a duplicate user message', () => {
    component.chats.update((chats) =>
      chats.map((chat) =>
        chat.id === component.activeChatId()
          ? { ...chat, messages: [{ role: 'user', content: 'Retry this prompt' }] }
          : chat,
      ),
    );
    component.errorMessage.set('Generation failed');

    component.retryLastPrompt();

    const request = httpTestingController.expectOne('http://localhost:8000/generate');
    expect(request.request.body).toEqual({ prompt: 'Retry this prompt' });
    expect(component.messages()).toEqual([{ role: 'user', content: 'Retry this prompt' }]);

    request.flush({ response: 'Generated successfully' });
    expect(component.messages()).toEqual([
      { role: 'user', content: 'Retry this prompt' },
      { role: 'assistant', content: 'Generated successfully' },
    ]);
    expect(component.errorMessage()).toBe('');
  });
});
