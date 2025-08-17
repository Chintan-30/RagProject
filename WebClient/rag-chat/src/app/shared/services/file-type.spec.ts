import { TestBed } from '@angular/core/testing';

import { FileType } from './file-type';

describe('FileType', () => {
  let service: FileType;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileType);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
