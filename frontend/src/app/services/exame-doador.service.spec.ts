import { TestBed } from '@angular/core/testing';

import { ExameDoadorService } from './exame-doador.service';

describe('ExameDoadorService', () => {
  let service: ExameDoadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExameDoadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
