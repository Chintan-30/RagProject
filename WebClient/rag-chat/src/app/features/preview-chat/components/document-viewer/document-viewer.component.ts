import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DocumentService } from '../../../../shared/services/document.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="document-viewer-container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Loading document...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && hasError" class="error-container">
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h3>Document not found</h3>
            <p>{{ errorMessage || 'Unable to load the requested document.' }}</p>
            <button mat-raised-button color="primary" (click)="retry()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Document Viewer -->
      <div *ngIf="!isLoading && !hasError && documentUrl" class="viewer-container">
        <!-- PDF Viewer -->
        <ngx-extended-pdf-viewer
          *ngIf="isPdfDocument()"
          [src]="getDocumentUrl()"
          [height]="'100vh'"
          [showSidebarButton]="false"
          [showFindButton]="false"
          [showPagingButtons]="true"
          [showZoomButtons]="true"
          [showPresentationModeButton]="false"
          [showOpenFileButton]="false"
          [showPrintButton]="false"
          [showDownloadButton]="false"
          [showSecondaryToolbarButton]="false"
          [showRotateButton]="false"
          [showHandToolButton]="false"
          [showScrollingButtons]="false"
          [showSpreadButton]="false"
          [showPropertiesButton]="false"
          (pdfLoaded)="onPdfLoaded($event)"
          (pdfLoadingFailed)="onPdfLoadingFailed($event)"
          (pdfLoadingStarts)="onPdfLoadingStarts($event)"
          (progress)="onProgress($event)">
        </ngx-extended-pdf-viewer>

        <!-- Non-PDF Format -->
        <div *ngIf="!isPdfDocument()" class="unsupported-format">
          <mat-card class="unsupported-card">
            <mat-card-content>
              <mat-icon class="file-icon">picture_as_pdf</mat-icon>
              <h3>PDF Preview Only</h3>
              <p>Only PDF documents can be previewed.</p>
              <div class="file-info">
                <p><strong>File:</strong> {{ getFileName() }}</p>
                <p><strong>Type:</strong> {{ getFileExtension().toUpperCase() }}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,

  styles: [`
    .document-viewer-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
      background-color: white;
    }

    .loading-text {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .error-container,
    .unsupported-format {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
    }

    .error-card,
    .unsupported-card {
      max-width: 500px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .error-icon,
    .file-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.7;
    }

    .error-icon {
      color: #f44336;
    }

    .file-icon {
      color: #2196f3;
    }

    .viewer-container {
      width: 100%;
      height: 100%;
      background-color: white;
    }

    .file-info {
      margin: 20px 0;
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 4px;
      text-align: left;
    }

    .file-info p {
      margin: 8px 0;
    }
  `]
})
export class DocumentViewerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() documentId: string = '';
  @Input() isLoading: boolean = true;
  @Input() fileSize?: string;

  documentPath: string = '';
  documentUrl: string = '';
  hasError: boolean = false;
  errorMessage: string = '';

  @Output() documentLoaded = new EventEmitter<any>();
  @Output() documentLoadError = new EventEmitter<any>();
  @Output() retryRequested = new EventEmitter<string>();

  constructor(private documentService: DocumentService, private http: HttpClient) {}

  ngOnInit() {
    if (this.documentId) {
      this.getDocumentById(this.documentId);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documentId'] && this.documentId) {
      this.hasError = false;
      this.errorMessage = '';
      this.cleanupBlobUrl(); // Clean up previous blob URL
      this.getDocumentById(this.documentId);
    }
  }

  ngOnDestroy() {
    this.cleanupBlobUrl();
  }

  private cleanupBlobUrl() {
    if (this.documentUrl) {
      URL.revokeObjectURL(this.documentUrl);
      this.documentUrl = '';
    }
  }

  getDocumentById(documentId: string) {
    this.isLoading = true;
    this.documentService.getDocumentById(documentId).subscribe({
      next: (response: any) => {
        this.documentPath = response.storage_path;
        this.loadDocumentAsBlob();
      },
      error: (error) => {
        console.error('Error loading document:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load document';
        this.isLoading = false;
      }
    });
  }

  private loadDocumentAsBlob() {
    // Extract just the filename from the path
    const filename = this.getFileName();
    
    // Call your backend API to get the file as blob
    this.documentService.getDocumentBlob(filename).subscribe({
      next: (blob: Blob) => {
        this.documentUrl = URL.createObjectURL(blob);
        this.isLoading = false;
        this.validateDocument();
      },
      error: (error) => {
        console.error('Error loading document blob:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load document file';
        this.isLoading = false;
      }
    });
  }

  private validateDocument(): void {
    if (!this.documentPath) {
      this.hasError = true;
      this.errorMessage = 'No document path provided';
      return;
    }

    // Only validate for PDF format
    if (!this.isPdfDocument()) {
      console.log(`Only PDF files are supported for preview`);
    }
  }

  getDocumentUrl(): string {
    console.log('getDocumentUrl called, returning:', this.documentUrl);
    return this.documentUrl || '';
  }

  isPdfDocument(): boolean {
    return this.getFileExtension().toLowerCase() === '.pdf';
  }

  isImageDocument(): boolean {
    return false; // Only PDF preview supported
  }

  getFileName(): string {
    if (!this.documentPath) return '';
    // Handle both Windows and Unix paths
    const parts = this.documentPath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
  }

  getFileExtension(): string {
    const fileName = this.getFileName();
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  downloadDocument(): void {
    if (this.documentPath) {
      const link = document.createElement('a');
      link.href = this.getDocumentUrl();
      link.download = this.getFileName();
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  retry(): void {
    this.hasError = false;
    this.errorMessage = '';
    if (this.documentId) {
      this.getDocumentById(this.documentId);
    }
    this.retryRequested.emit(this.documentId);
  }

  onPdfLoaded(event: any): void {
    console.log('PDF loaded successfully in viewer:', event);
    this.documentLoaded.emit(event);
  }

  onPdfLoadingFailed(event: any): void {
    console.error('PDF loading failed in viewer:', event);
    this.hasError = true;
    this.errorMessage = 'Failed to load PDF document';
    this.documentLoadError.emit(event);
  }

  onPdfLoadingStarts(event: any): void {
    console.log('PDF loading started:', event);
  }

  onProgress(event: any): void {
    console.log('PDF loading progress:', event);
  }

  onImageLoaded(): void {
    console.log('Image loaded successfully');
    this.documentLoaded.emit({ type: 'image' });
  }

  onImageLoadError(): void {
    console.error('Image loading failed');
    this.hasError = true;
    this.errorMessage = 'Failed to load image';
    this.documentLoadError.emit({ type: 'image' });
  }
}