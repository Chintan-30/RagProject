import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentStats } from './document-stats';

describe('DocumentStats', () => {
  let component: DocumentStats;
  let fixture: ComponentFixture<DocumentStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
