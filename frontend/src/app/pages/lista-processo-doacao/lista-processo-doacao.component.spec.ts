import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaProcessoDoacaoComponent } from './lista-processo-doacao.component';

describe('ListaProcessoDoacaoComponent', () => {
  let component: ListaProcessoDoacaoComponent;
  let fixture: ComponentFixture<ListaProcessoDoacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaProcessoDoacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaProcessoDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
