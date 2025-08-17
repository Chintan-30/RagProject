import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentActions } from './document-actions';

describe('DocumentActions', () => {
  let component: DocumentActions;
  let fixture: ComponentFixture<DocumentActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentActions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentActions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
