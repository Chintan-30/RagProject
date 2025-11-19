import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ChatInterfaceComponent } from '../chat-interface/chat-interface.component';
import { DocumentService } from '../../../../shared/services/document.service';

@Component({
  selector: 'app-split-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    DocumentViewerComponent,
    ChatInterfaceComponent
  ],
  templateUrl: './split-panel.html',
  styleUrls: ['./split-panel.scss']
})
export class SplitPanelComponent implements OnInit {
  documentPath: string = '';
  documentId: string = '';
  isLoading: boolean = true;
  collectionName: string = '';

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.documentId = params['id'];
      console.log('Loading document:', this.documentId);
      this.getDocumentById(this.documentId);
    });
  }

  getDocumentById(documentId: string) {
    this.isLoading = true;
    this.documentService.getDocumentById(documentId).subscribe({
      next: (response: any) => {
        this.documentPath = response.storage_path;
        this.collectionName = response.collection_name;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading document:', error);
        this.isLoading = false;
        this.documentPath = ''; // Clear path on error
      }
    });
  }
}