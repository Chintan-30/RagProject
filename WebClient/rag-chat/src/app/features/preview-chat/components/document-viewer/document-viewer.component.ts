import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="document-viewer-container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading document...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !documentPath" class="error-container">
        <mat-card>
          <mat-card-content>
            <h3>Document not found</h3>
            <p>Unable to load the requested document.</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Document Viewer -->
      <div *ngIf="!isLoading && documentPath" class="viewer-container">
        <!-- For PDF files -->
        <ngx-extended-pdf-viewer
          *ngIf="isPdfDocument()"
          [src]="getDocumentUrl()"
          [height]="'100vh'"
          [showSidebarButton]="true"
          [showFindButton]="true"
          [showPagingButtons]="true"
          [showZoomButtons]="true"
          [showPresentationModeButton]="true"
          [showOpenFileButton]="false"
          [showPrintButton]="true"
          [showDownloadButton]="true"
          [showSecondaryToolbarButton]="true"
          [showRotateButton]="true"
          [showHandToolButton]="true"
          [showScrollingButtons]="true"
          [showSpreadButton]="true"
          [showPropertiesButton]="true">
        </ngx-extended-pdf-viewer>

        <!-- For other document types -->
        <div *ngIf="!isPdfDocument()" class="unsupported-format">
          <mat-card>
            <mat-card-content>
              <h3>Preview not available</h3>
              <p>This document format is not supported for preview.</p>
              <p><strong>File:</strong> {{ getFileName() }}</p>
              <p><strong>Path:</strong> {{ documentPath }}</p>
              <button mat-raised-button color="primary" (click)="downloadDocument()">
                Download Document
              </button>
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
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
    }

    .error-container,
    .unsupported-format {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
    }

    .viewer-container {
      width: 100%;
      height: 100%;
    }

    .unsupported-format mat-card {
      max-width: 500px;
      text-align: center;
    }
  `]
})
export class DocumentViewerComponent implements OnChanges, OnDestroy, OnInit {
  @Input() documentPath: string = '';
  @Input() documentId: string = '';
  @Input() isLoading: boolean = true;

  private currentBlobUrl: string | null = null;

  ngOnInit() {debugger
    if (this.documentPath) {
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documentPath'] && this.documentPath) {
      console.log('Document path updated:', this.documentPath);
      
      // Clean up previous blob URL
      if (this.currentBlobUrl && this.currentBlobUrl !== this.documentPath) {
        URL.revokeObjectURL(this.currentBlobUrl);
      }
      
      // Store current blob URL for cleanup
      if (this.documentPath.startsWith('blob:')) {
        this.currentBlobUrl = this.documentPath;
      }
    }
  }

  ngOnDestroy() {
    // Clean up blob URL when component is destroyed
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
  }

  getDocumentUrl(): string {
    // If it's already a blob URL or full URL, return as is
    if (this.documentPath.startsWith('blob:') || 
        this.documentPath.startsWith('http://') || 
        this.documentPath.startsWith('https://')) {
      return this.documentPath;
    }
    
    // This shouldn't happen now, but keeping as fallback
    return `http://localhost:8000${this.documentPath}`;
  }

  isPdfDocument(): boolean {
    if (!this.documentPath) return false;
    
    const fileName = this.getFileName().toLowerCase();
    return fileName.endsWith('.pdf');
  }

  getFileName(): string {
    if (!this.documentPath) return '';
    
    const parts = this.documentPath.split('/');
    return parts[parts.length - 1];
  }

  downloadDocument(): void {
    if (this.documentPath) {
      const link = document.createElement('a');
      link.href = this.getDocumentUrl();
      link.download = this.getFileName();
      link.click();
    }
  }
}