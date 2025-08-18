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
        <app-document-viewer [documentPath]="documentPath"></app-document-viewer>
      </mat-sidenav-content>
      
      <mat-sidenav #chatDrawer position="end" mode="side" opened class="chat-panel">
        <app-chat-interface></app-chat-interface>
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
  documentPath: string= '';
  constructor(private route: ActivatedRoute,private documentService: DocumentService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const documentId = params['id'];
      // TODO: Load document using document service
      console.log('Loading document:', documentId);
      this.getDocumentById(documentId);
    });
  }

  getDocumentById(documentId: string) {
    this.documentService.getDocumentById(documentId).subscribe((response: any) => {
        this.documentPath = response.storage_path;
    });
  }
}
