import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericUploader } from './generic-uploader';

describe('GenericUploader', () => {
  let component: GenericUploader;
  let fixture: ComponentFixture<GenericUploader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericUploader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericUploader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
