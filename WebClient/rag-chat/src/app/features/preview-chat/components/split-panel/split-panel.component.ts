import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
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
    NgxExtendedPdfViewerModule,
    DocumentViewerComponent,
    ChatInterfaceComponent
  ],
  template: `
    <mat-sidenav-container class="container">
      <mat-sidenav-content class="document-view">
        <app-document-viewer 
          [documentId]="documentId">
        </app-document-viewer>
      </mat-sidenav-content>
      
      <mat-sidenav #chatDrawer position="end" mode="side" opened class="chat-panel">
        <app-chat-interface [collectionName]="collectionName"></app-chat-interface>
      </mat-sidenav>
    </mat-sidenav-container>
  `,
  styles: [`
    .container {
      width: 100%;
      height: 100vh;
    }

    .document-view {
      padding: 20px;
    }

    .chat-panel {
      width: 400px;
      border-left: 1px solid #ccc;
    }
  `]
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