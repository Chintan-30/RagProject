import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentTable } from './document-table';

describe('DocumentTable', () => {
  let component: DocumentTable;
  let fixture: ComponentFixture<DocumentTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
