import { TestBed } from '@angular/core/testing';

import { BusTripService } from './bus-trip-service';

describe('BusTripService', () => {
  let service: BusTripService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusTripService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
