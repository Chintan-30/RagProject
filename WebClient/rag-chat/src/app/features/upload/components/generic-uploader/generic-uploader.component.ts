import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxFileDropModule, FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { DocumentService } from '../../../../shared/services/document.service';
import { HttpEventType } from '@angular/common/http';

interface UploadState {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}


@Component({
  selector: 'app-generic-uploader',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule,
    NgxFileDropModule
  ],
  templateUrl: './generic-uploader.html',
  styleUrls: ['./generic-uploader.scss']
})
export class GenericUploaderComponent {
  uploads: UploadState[] = [];

  constructor(private documentService: DocumentService, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef) { }

  // Configuration options - you can make these inputs if needed
  chunkSize = 1000;
  chunkOverlap = 400;
  collectionName?: string;

  dropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.uploadFile(file);
        });
      }
    }
  }

  private uploadFile(file: File) {
    const uploadId = crypto.randomUUID();
    const uploadState: UploadState = {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    };
    this.uploads.push(uploadState);

    this.documentService.uploadDocument(
      file,
      this.chunkSize,
      this.chunkOverlap,
      this.collectionName ?? 'default'
    ).subscribe({
      next: (response) => {
        this.updateUploadState(uploadId, { status: 'success' });
        this.snackBar.open(`${file.name} uploaded successfully!`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        setTimeout(() => {
          this.updateUploadState(uploadId, { status: 'error' });
        });

        this.snackBar.open(
          `Failed to upload ${file.name} || 'Unknown error'}`,
          'Close',
          { duration: 5000 }
        );
        console.error('Upload error:', error);
      }

    });
  }

  private updateUploadState(uploadId: string, patch: Partial<UploadState>) {
    const index = this.uploads.findIndex(u => u.id === uploadId);
    if (index !== -1) {
      this.uploads[index] = { ...this.uploads[index], ...patch };
    }
    this.cdr.detectChanges();
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'success': return 'Success';
      case 'error': return 'Failed';
      default: return '';
    }
  }

  // Optional: Method to clear completed uploads
  clearCompletedUploads() {
    this.uploads = this.uploads.filter(upload => upload.status === 'uploading');
  }
}