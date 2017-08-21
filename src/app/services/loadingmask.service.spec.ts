import { TestBed, inject } from '@angular/core/testing';

import { LoadingmaskService } from './loadingmask.service';

describe('LoadingmaskService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingmaskService]
    });
  });

  it('should be created', inject([LoadingmaskService], (service: LoadingmaskService) => {
    expect(service).toBeTruthy();
  }));
});
