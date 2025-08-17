import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(documentId: string, message: string): Observable<ChatMessage> {
    // TODO: Replace with actual API endpoint
    return this.http.post<ChatMessage>(`/api/chat/${documentId}`, { message });
  }

  getChatHistory(documentId: string): Observable<ChatMessage[]> {
    // TODO: Replace with actual API endpoint
    return this.http.get<ChatMessage[]>(`/api/chat/${documentId}/history`);
  }
}
