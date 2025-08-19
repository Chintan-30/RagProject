import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, timeout } from 'rxjs';

export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = 'http://localhost:8000/chat';
  private readonly defaultTimeout = 30000; // 30 seconds

  constructor(private http: HttpClient) {}

sendMessage(
    query: string, 
    collectionName: string, 
    maxResults: number = 4, 
    model: string = 'gpt-4.1'
  ): Observable<any> {
    const request: any = {
      query: query.trim(),
      collection_name: collectionName,
      max_results: maxResults,
      model: model
    };

    return this.http.post<any>(this.apiUrl, request)
      .pipe(
        timeout(this.defaultTimeout),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your connection.';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please check your credentials.';
          break;
        case 404:
          errorMessage = 'Service not found. Please contact support.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
      }
    }

    console.error('Chat service error:', error);
    return throwError(() => new Error(errorMessage));
  }
  
}
