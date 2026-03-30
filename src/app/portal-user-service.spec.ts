import { TestBed } from '@angular/core/testing';

import { PortalUserService } from './portal-user-service';

describe('PortalUserService', () => {
  let service: PortalUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortalUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
