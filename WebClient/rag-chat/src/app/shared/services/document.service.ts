import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documents: Document[] = [];

  constructor(private http: HttpClient) {}

  uploadDocument(file: File): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);

    // TODO: Replace with actual API endpoint
    return this.http.post<Document>('/api/documents/upload', formData);
  }

  getDocuments(): Observable<Document[]> {
    // TODO: Replace with actual API call
    return of(this.documents);
  }

  getDocumentById(id: string): Observable<Document | undefined> {
    // TODO: Replace with actual API call
    return of(this.documents.find(doc => doc.id === id));
  }

  deleteDocument(id: string): Observable<void> {
    // TODO: Replace with actual API call
    return this.http.delete<void>(`/api/documents/${id}`);
  }
}
