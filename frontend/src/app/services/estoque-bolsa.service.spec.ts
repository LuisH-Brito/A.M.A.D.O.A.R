import { TestBed } from '@angular/core/testing';

import { EstoqueBolsaService } from './estoque-bolsa.service';

describe('EstoqueBolsaService', () => {
  let service: EstoqueBolsaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstoqueBolsaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
