import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarteiraDoacaoComponent } from './carteira-doacao.component';

describe('CarteiraDoacaoComponent', () => {
  let component: CarteiraDoacaoComponent;
  let fixture: ComponentFixture<CarteiraDoacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarteiraDoacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarteiraDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
