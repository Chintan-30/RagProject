import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DocumentService } from '../../../../shared/services/document.service';

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
  templateUrl: 'document-viewer.html',
  styleUrl: 'document-viewer.scss'
})
export class DocumentViewerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() documentId: string = '';
  documentPath: string = '';
  documentUrl: string = '';
  hasError: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  isPdfReady: boolean = false;
  blobSize: number = 0;
  showDebugInfo: boolean = true; // Set to false in production

  @Output() documentLoaded = new EventEmitter<any>();
  @Output() documentLoadError = new EventEmitter<any>();
  @Output() retryRequested = new EventEmitter<string>();
  @Output() loadingStateChanged = new EventEmitter<boolean>();

  private loadingTimeout: any;
  private pdfLoadTimeout: any;

  constructor(
    private documentService: DocumentService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.documentId) {
      this.getDocumentById(this.documentId);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documentId']) {
      if (this.documentId && this.documentId !== changes['documentId'].previousValue) {
        this.resetState();
        // Add delay to ensure cleanup is complete
        setTimeout(() => {
          this.getDocumentById(this.documentId);
        }, 100);
      } else if (!this.documentId) {
        this.resetState();
      }
    }
  }

  ngOnDestroy() {
    this.cleanupBlobUrl();
    this.clearTimeouts();
  }

  private clearTimeouts() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    if (this.pdfLoadTimeout) {
      clearTimeout(this.pdfLoadTimeout);
    }
  }

  private resetState() {
    this.hasError = false;
    this.errorMessage = '';
    this.isPdfReady = false;
    this.blobSize = 0;
    this.cleanupBlobUrl();
    this.documentPath = '';
    this.setLoadingState(false);
    this.clearTimeouts();
  }

  private cleanupBlobUrl() {
    if (this.documentUrl) {
      URL.revokeObjectURL(this.documentUrl);
      this.documentUrl = '';
    }
  }

  private setLoadingState(loading: boolean) {
    this.isLoading = loading;
    this.loadingStateChanged.emit(loading);
    this.cdr.detectChanges();
  }

  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }

  testBlobUrl() {
    if (this.documentUrl) {
      window.open(this.documentUrl, '_blank');
    }
  }

  getDocumentById(documentId: string) {
    if (!documentId) {
      return;
    }

    this.setLoadingState(true);
    this.hasError = false;
    this.errorMessage = '';
    this.isPdfReady = false;

    // Set a timeout for the entire loading process
    this.loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.hasError = true;
        this.errorMessage = 'Document loading timed out';
        this.setLoadingState(false);
      }
    }, 30000);

    this.documentService.getDocumentById(documentId).subscribe({
      next: (response: any) => {
        this.documentPath = response.storage_path;
        this.loadDocumentAsBlob();
      },
      error: (error) => {
        console.error('Error loading document metadata:', error);
        this.hasError = true;
        this.errorMessage = `Failed to load document metadata: ${error.message || error}`;
        this.setLoadingState(false);
        this.documentLoadError.emit(error);
        this.clearTimeouts();
      }
    });
  }

  private loadDocumentAsBlob() {
    const filename = this.getFileName();
    
    if (!filename) {
      console.error('No filename extracted from path:', this.documentPath);
      this.hasError = true;
      this.errorMessage = 'Invalid document path';
      this.setLoadingState(false);
      return;
    }
    
    this.documentService.getDocumentBlob(filename).subscribe({
      next: (blob: Blob) => {
        this.blobSize = blob.size;
        
        // Validate blob
        if (!blob || blob.size === 0) {
          console.error('Invalid blob received - empty or null');
          this.hasError = true;
          this.errorMessage = 'Document file is empty or invalid';
          this.setLoadingState(false);
          return;
        }

        // Validate blob type for PDF
        if (this.isPdfDocument() && blob.type && !blob.type.includes('pdf')) {
          console.warn('Blob type mismatch. Expected PDF, got:', blob.type);
          // Don't fail here, sometimes servers don't set correct MIME type
        }
        
        // Clean up any existing blob URL
        this.cleanupBlobUrl();
        
        // Create new blob URL
        this.documentUrl = URL.createObjectURL(blob);
        
        if (this.isPdfDocument()) {
          this.isPdfReady = true;
          this.isLoading = false;
          
          // Set a longer timeout for PDF loading (30 seconds)
          this.pdfLoadTimeout = setTimeout(() => {
            if (this.isLoading) {
              this.hasError = true;
              this.errorMessage = 'PDF viewer failed to load the document. The file may be corrupted or too large.';
              this.setLoadingState(false);
            }
          }, 30000); // Increased to 30 seconds
          
          // Force change detection to ensure the PDF viewer gets the new URL
          this.cdr.detectChanges();
          
          // Add a small delay to let Angular update the DOM
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
          
        } else {
          this.isPdfReady = true;
          this.isLoading = false;
          this.setLoadingState(false);
          this.validateDocument();
        }
      },
      error: (error) => {
        console.error('Error loading document blob:', error);
        this.hasError = true;
        this.errorMessage = `Failed to load document file: ${error.message || error}`;
        this.setLoadingState(false);
        this.documentLoadError.emit(error);
        this.clearTimeouts();
      }
    });
  }

  // REMOVED: testBlobUrlAccessibility() method
  // Blob URLs cannot be accessed via XMLHttpRequest - they only work for direct browser usage

  private validateDocument(): void {
    if (!this.documentPath) {
      this.hasError = true;
      this.errorMessage = 'No document path provided';
      return;
    }
  }

  getDocumentUrl(): string {
    return this.documentUrl || '';
  }

  isPdfDocument(): boolean {
    const extension = this.getFileExtension().toLowerCase();
    return extension === '.pdf';
  }

  isImageDocument(): boolean {
    return false;
  }

  getFileName(): string {
    if (!this.documentPath) return '';
    // Handle both Windows and Unix paths
    const parts = this.documentPath.replace(/\\/g, '/').split('/');
    const filename = parts[parts.length - 1];
    return filename;
  }

  getFileExtension(): string {
    const fileName = this.getFileName();
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  downloadDocument(): void {
    if (this.documentUrl) {
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
    this.resetState();
    if (this.documentId) {
      setTimeout(() => {
        this.getDocumentById(this.documentId);
      }, 200);
    }
    this.retryRequested.emit(this.documentId);
  }

  onPdfLoaded(event: any): void {
    this.clearTimeouts();
    this.setLoadingState(false);
    this.hasError = false;
    this.documentLoaded.emit(event);
  }

  onPdfLoadingFailed(event: any): void {
    console.error('PDF loading failed in viewer:', event);
    
    this.clearTimeouts();
    this.hasError = true;
    this.errorMessage = `PDF loading failed: ${event?.message || 'Unknown error'}`;
    this.setLoadingState(false);
    this.documentLoadError.emit(event);
  }

  onPdfLoadingStarts(event: any): void {
    // Keep loading state active
  }

  onProgress(event: any): void {
  }

  onImageLoaded(): void {
    this.documentLoaded.emit({ type: 'image' });
  }

  onImageLoadError(): void {
    console.error('Image loading failed');
    this.hasError = true;
    this.errorMessage = 'Failed to load image';
    this.documentLoadError.emit({ type: 'image' });
  }
}