import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, of, retry, throwError } from 'rxjs';

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
  constructor(private http: HttpClient) { }

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

    return this.http.post<Document>(this.apiURL + '/indexing/upload', formData, {
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

    return this.http.get<Document[]>(`${this.apiURL}/files/`, { params }).pipe(
      retry(2), // Retry up to 2 times on error
      catchError(this.handleError)
    );
  }

getDocumentBlob(filePath: string): Observable<Blob> {
  const encodedPath = encodeURIComponent(filePath);
  return this.http.get(`${this.apiURL}/files/blob?path=${encodedPath}`, {
    responseType: 'blob'
  });
}


  getDocumentById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/files/${id}`).pipe(
      retry(2), // Retry up to 2 times on error
      catchError(this.handleError)
    );
  }

  deleteDocument(id: string): Observable<void> {
    // TODO: Replace with actual API call
    return this.http.delete<void>(`/api/documents/${id}`);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorResponse: any;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorResponse = {
        code: 'CLIENT_ERROR',
        message: 'A network error occurred. Please check your connection.',
        details: error.error.message
      };
    } else {
      // Server-side error
      switch (error.status) {
        case 404:
          errorResponse = {
            code: 'NOT_FOUND',
            message: 'Document not found',
            details: error.error
          };
          break;
        case 403:
          errorResponse = {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this document',
            details: error.error
          };
          break;
        case 500:
          errorResponse = {
            code: 'SERVER_ERROR',
            message: 'Server error occurred. Please try again later.',
            details: error.error
          };
          break;
        default:
          errorResponse = {
            code: 'UNKNOWN_ERROR',
            message: `An error occurred: ${error.message}`,
            details: error.error
          };
      }
    }

    console.error('Document service error:', errorResponse);
    return throwError(() => errorResponse);
  }

}
