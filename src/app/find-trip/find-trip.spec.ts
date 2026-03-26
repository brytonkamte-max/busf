import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindTrip } from './find-trip';

describe('FindTrip', () => {
  let component: FindTrip;
  let fixture: ComponentFixture<FindTrip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindTrip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FindTrip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
