import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitPanel } from './split-panel';

describe('SplitPanel', () => {
  let component: SplitPanel;
  let fixture: ComponentFixture<SplitPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
