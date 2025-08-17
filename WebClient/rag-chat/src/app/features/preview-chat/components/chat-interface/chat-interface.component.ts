import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
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
    MatIconModule
  ],
  template: `
    <div class="chat-container">
      <div class="messages" #messageContainer>
        <div *ngFor="let message of messages" 
             [class.user-message]="message.isUser"
             [class.bot-message]="!message.isUser"
             class="message">
          <div class="message-content">
            {{ message.content }}
          </div>
          <div class="message-time">
            {{ message.timestamp | date:'shortTime' }}
          </div>
        </div>
      </div>
      
      <div class="input-container">
        <mat-form-field appearance="outline" class="message-input">
          <input matInput
                 [(ngModel)]="newMessage"
                 placeholder="Ask about the document..."
                 (keyup.enter)="sendMessage()">
        </mat-form-field>
        <button mat-icon-button color="primary" (click)="sendMessage()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: 20px;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 20px;
    }

    .message {
      margin: 10px 0;
      padding: 10px;
      border-radius: 8px;
      max-width: 80%;
    }

    .user-message {
      background-color: #e3f2fd;
      margin-left: auto;
    }

    .bot-message {
      background-color: #f5f5f5;
      margin-right: auto;
    }

    .message-content {
      margin-bottom: 4px;
    }

    .message-time {
      font-size: 0.8em;
      color: #666;
    }

    .input-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .message-input {
      flex: 1;
    }
  `]
})
export class ChatInterfaceComponent {
  messages: ChatMessage[] = [];
  newMessage = '';

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.messages.push({
      content: this.newMessage,
      isUser: true,
      timestamp: new Date()
    });

    // TODO: Implement actual chat service integration
    setTimeout(() => {
      this.messages.push({
        content: 'This is a sample response. Chat service integration pending.',
        isUser: false,
        timestamp: new Date()
      });
    }, 1000);

    this.newMessage = '';
  }
}
