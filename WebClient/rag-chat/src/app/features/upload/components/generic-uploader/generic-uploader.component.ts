import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxFileDropModule, FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';

@Component({
  selector: 'app-generic-uploader',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    NgxFileDropModule
  ],
  template: `
    <mat-card class="uploader-card">
      <mat-card-header>
        <mat-card-title>Upload Documents</mat-card-title>
        <mat-card-subtitle>Drag and drop files or click to browse</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <ngx-file-drop
          dropZoneLabel="Drop files here"
          (onFileDrop)="dropped($event)"
          [showBrowseBtn]="true"
          browseBtnLabel="Choose files"
          [multiple]="true"
          accept=".pdf,.txt,.csv,.xlsx">
          <ng-template ngx-file-drop-content-tmp let-openFileSelector="openFileSelector">
            <button mat-raised-button color="primary" (click)="openFileSelector()">
              Choose Files
            </button>
          </ng-template>
        </ngx-file-drop>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .uploader-card {
      max-width: 600px;
      margin: 20px auto;
    }
    
    :host ::ng-deep .ngx-file-drop__drop-zone {
      border: 2px dashed #ccc;
      border-radius: 4px;
      padding: 20px;
      text-align: center;
      background: #fafafa;
      margin: 10px 0;
    }

    :host ::ng-deep .ngx-file-drop__content {
      color: #666;
    }
  `]
})
export class GenericUploaderComponent {
  dropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          // Here we'll handle the file upload
          console.log(file);
          // TODO: Implement file upload logic
        });
      }
    }
  }
}
