import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadQueue } from './upload-queue';

describe('UploadQueue', () => {
  let component: UploadQueue;
  let fixture: ComponentFixture<UploadQueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadQueue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadQueue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
