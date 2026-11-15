import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccettazioneLezioneComponent } from './accettazione-lezione.component';

describe('AccettazioneLezioneComponent', () => {
  let component: AccettazioneLezioneComponent;
  let fixture: ComponentFixture<AccettazioneLezioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccettazioneLezioneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccettazioneLezioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
