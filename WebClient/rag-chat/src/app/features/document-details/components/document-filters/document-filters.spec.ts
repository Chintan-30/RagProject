import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentFilters } from './document-filters';

describe('DocumentFilters', () => {
  let component: DocumentFilters;
  let fixture: ComponentFixture<DocumentFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
