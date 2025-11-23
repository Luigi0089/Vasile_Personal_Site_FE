import { TestBed } from '@angular/core/testing';

import { LezioniService } from './lezioni.service';

describe('LezioniService', () => {
  let service: LezioniService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LezioniService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
