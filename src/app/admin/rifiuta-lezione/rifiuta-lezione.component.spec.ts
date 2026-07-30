import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RifiutaLezioneComponent } from './rifiuta-lezione.component';

describe('RifiutaLezioneComponent', () => {
  let component: RifiutaLezioneComponent;
  let fixture: ComponentFixture<RifiutaLezioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RifiutaLezioneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RifiutaLezioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
