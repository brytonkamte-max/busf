import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusLine } from './bus-line';

describe('BusLine', () => {
  let component: BusLine;
  let fixture: ComponentFixture<BusLine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusLine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusLine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
