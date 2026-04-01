import { TestBed } from '@angular/core/testing';

import { BusStopGeocodeService } from './bus-stop-geocode-service';

describe('BusStopGeocodeService', () => {
  let service: BusStopGeocodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusStopGeocodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
