import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChatService } from '../../../../shared/services/chat.service';
import { MatCard } from "@angular/material/card";
import { MaterialModule } from "../../../../shared/material.module";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  error?: boolean;
  searchResults?: any;
}

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCard,
    MaterialModule
],
  templateUrl: './chat-interface.html',
  styleUrls: ['./chat-interface.scss']
})
export class ChatInterfaceComponent {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  @Input() documentId: string = '';
  @Input() collectionName: string = '';
  @Input() maxResults: number = 4;
  @Input() model: string = 'gpt-4.1';
  
  messages: ChatMessage[] = [];
  newMessage = '';
  isLoading = false;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (this.collectionName) {
      this.addWelcomeMessage();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isLoading || !this.collectionName) return;

    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: this.newMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;
    
    const messageToSend = this.newMessage.trim();
    this.newMessage = '';
    this.isLoading = true;

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: this.generateId(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    
    this.messages.push(typingMessage);
    this.shouldScrollToBottom = true;

    // Send to chat service
    this.chatService.sendMessage(messageToSend, this.collectionName, this.maxResults, this.model)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.handleChatResponse(response, typingMessage.id);
        },
        error: (error: Error) => {
          this.handleChatError(error, typingMessage.id);
        }
      });
  }

  private handleChatResponse(response: any, typingMessageId: string) {
    // Remove typing indicator
    this.messages = this.messages.filter(msg => msg.id !== typingMessageId);
    
    // Add actual response
    const botMessage: ChatMessage = {
      id: this.generateId(),
      content: response.answer,
      isUser: false,
      timestamp: new Date(),
      searchResults: response.search_results
    };
    
    this.messages.push(botMessage);
    this.shouldScrollToBottom = true;
    this.isLoading = false;
    
    // Focus back to input
    setTimeout(() => {
      this.messageInput?.nativeElement?.focus();
    }, 100);
  }

  private handleChatError(error: Error, typingMessageId: string) {
    // Remove typing indicator
    this.messages = this.messages.filter(msg => msg.id !== typingMessageId);
    
    // Add error message
    const errorMessage: ChatMessage = {
      id: this.generateId(),
      content: error.message || 'Sorry, I encountered an error. Please try again.',
      isUser: false,
      timestamp: new Date(),
      error: true
    };
    
    this.messages.push(errorMessage);
    this.shouldScrollToBottom = true;
    this.isLoading = false;

    // Show snackbar notification
    this.snackBar.open('Failed to send message. Please try again.', 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    // Focus back to input
    setTimeout(() => {
      this.messageInput?.nativeElement?.focus();
    }, 100);
  }

  private addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      content: `Hello! I'm ready to help you with questions about your document. What would you like to know?`,
      isUser: false,
      timestamp: new Date()
    };
    
    this.messages.push(welcomeMessage);
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom(): void {
    try {
      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}