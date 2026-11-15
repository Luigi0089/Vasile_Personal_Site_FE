import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneLezioniComponent } from './gestione-lezioni.component';

describe('GestioneLezioniComponent', () => {
  let component: GestioneLezioniComponent;
  let fixture: ComponentFixture<GestioneLezioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestioneLezioniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestioneLezioniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
