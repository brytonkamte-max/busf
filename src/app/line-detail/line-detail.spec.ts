import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineDetail } from './line-detail';

describe('LineDetail', () => {
  let component: LineDetail;
  let fixture: ComponentFixture<LineDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
