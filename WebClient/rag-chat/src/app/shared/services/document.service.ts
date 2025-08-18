import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  apiURL: string = 'http://localhost:8000';
  constructor(private http: HttpClient) {}

  uploadDocument(
    file: File,
    chunkSize: number = 1000,
    chunkOverlap: number = 400,
    collectionName?: string
  ): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);

    // Build query parameters
    const params = new HttpParams()
      .set('chunk_size', chunkSize.toString())
      .set('chunk_overlap', chunkOverlap.toString())
      .set('collection_name', collectionName || '');

    return this.http.post<Document>(this.apiURL+'/indexing/upload', formData, {
      params: params
    });
  }

  getAllDocuments(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<Document[]> {
    const params = new HttpParams()
      .set('page_number', pageNumber.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<Document[]>(`${this.apiURL}/files/`, { params });
  }


  getDocumentById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/files/${id}`);
  }

  deleteDocument(id: string): Observable<void> {
    // TODO: Replace with actual API call
    return this.http.delete<void>(`/api/documents/${id}`);
  }
}
