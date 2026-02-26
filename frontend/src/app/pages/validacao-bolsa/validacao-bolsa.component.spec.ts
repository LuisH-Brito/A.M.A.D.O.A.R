import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidacaoBolsaComponent } from './validacao-bolsa.component';

describe('ValidacaoBolsaComponent', () => {
  let component: ValidacaoBolsaComponent;
  let fixture: ComponentFixture<ValidacaoBolsaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidacaoBolsaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidacaoBolsaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
