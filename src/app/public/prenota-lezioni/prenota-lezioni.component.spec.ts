import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrenotaLezioniComponent } from './prenota-lezioni.component';

describe('PrenotaLezioniComponent', () => {
  let component: PrenotaLezioniComponent;
  let fixture: ComponentFixture<PrenotaLezioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrenotaLezioniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrenotaLezioniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
