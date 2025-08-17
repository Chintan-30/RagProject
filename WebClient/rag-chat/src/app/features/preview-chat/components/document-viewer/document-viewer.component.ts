import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule
  ],
  template: `
    <div class="viewer-container">
      <ngx-extended-pdf-viewer
        *ngIf="pdfUrl"
        [src]="pdfUrl"
        [height]="'100%'"
        [textLayer]="true"
        [handTool]="true">
      </ngx-extended-pdf-viewer>
    </div>
  `,
  styles: [`
    .viewer-container {
      height: calc(100vh - 40px);
      overflow: auto;
    }
  `]
})
export class DocumentViewerComponent {
  @Input() pdfUrl: string | null = null;
}
