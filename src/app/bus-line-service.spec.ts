import { TestBed } from '@angular/core/testing';

import { BusLineService } from './bus-line-service';

describe('BusLineService', () => {
  let service: BusLineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusLineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
