import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodigoSenhaComponent } from './codigo-senha.component';

describe('CodigoSenhaComponent', () => {
  let component: CodigoSenhaComponent;
  let fixture: ComponentFixture<CodigoSenhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigoSenhaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodigoSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
