import { TestBed } from '@angular/core/testing';

import { BusStopService } from './bus-stop-service';

describe('BusStopService', () => {
  let service: BusStopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusStopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
