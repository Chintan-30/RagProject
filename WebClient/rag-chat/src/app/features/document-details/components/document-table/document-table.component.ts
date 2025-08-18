import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { DocumentService } from '../../../../shared/services/document.service';

interface DocumentInfo {
  id: string;
  collection_name?: string;
  filename?: string;
  document_count?: number;
  chunk_count?: number;
  file_size?: number;
  upload_date?: string;
  storage_path?: string;
}

@Component({
  selector: 'app-document-table',
  standalone: true, // ← This is key!
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './document-table.html',
  styleUrls: ['./document-table.scss']
})
export class DocumentTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'filename',
    'collection_name',
    'document_count',
    'chunk_count',
    'file_size',
    'upload_date',
    'actions'
  ];

  dataSource: MatTableDataSource<DocumentInfo>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  pageNumber: number = 1;
  pageSize: number = 5;
  totalRecords: number = 0;
  constructor(private router: Router, private documentService: DocumentService) {
    this.dataSource = new MatTableDataSource<DocumentInfo>();
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.getAllDocuments(this.pageNumber, this.pageSize);
  }

  getAllDocuments(pageNumber: number, pageSize: number) {
  this.documentService.getAllDocuments(pageNumber, pageSize)
    .subscribe((res: any) => {
      this.dataSource.data = res.doc_details;   // actual items
      this.totalRecords = res.TotalRecords;     // total count from backend
    });
}


  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  previewDocument(doc: DocumentInfo) {
    this.router.navigate(['/preview', doc.id]);
  }

  deleteDocument(doc: DocumentInfo) {
    if (confirm(`Are you sure you want to delete "${doc.collection_name}"?`)) {
      const index = this.dataSource.data.findIndex(d => d.id === doc.id);
      if (index > -1) {
        const newData = [...this.dataSource.data];
        newData.splice(index, 1);
        this.dataSource.data = newData;
      }
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onPageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex + 1; // Angular is 0-based, backend likely 1-based
    this.pageSize = event.pageSize;

    this.getAllDocuments(this.pageNumber, this.pageSize);
  }


  getFileIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'docx':
      case 'doc':
        return 'description';
      case 'xlsx':
      case 'xls':
        return 'table_chart';
      case 'pptx':
      case 'ppt':
        return 'slideshow';
      case 'txt':
        return 'text_snippet';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      default:
        return 'insert_drive_file';
    }
  }
}