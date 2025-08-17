import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
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
  displayedColumns: string[] = ['name', 'type', 'size', 'uploadDate', 'actions'];
  dataSource: MatTableDataSource<DocumentInfo>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) {
    this.dataSource = new MatTableDataSource<DocumentInfo>();
  }

  ngOnInit() {
    const sampleData: DocumentInfo[] = [
      {
        id: '1',
        name: 'Annual Report 2024.pdf',
        type: 'PDF',
        size: 2.5 * 1024 * 1024,
        uploadDate: new Date('2024-01-15')
      },
      {
        id: '2',
        name: 'Project Guidelines.docx',
        type: 'DOCX',
        size: 1.2 * 1024 * 1024,
        uploadDate: new Date('2024-02-10')
      },
      {
        id: '3',
        name: 'Data Analysis.xlsx',
        type: 'XLSX',
        size: 856 * 1024,
        uploadDate: new Date('2024-03-05')
      }
    ];
    this.dataSource.data = sampleData;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
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
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
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