import { TestBed } from '@angular/core/testing';

import { StackService } from './stack.service';

describe('ProgettiService', () => {
  let service: StackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
