import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormColetaComponent } from './form-coleta.component';

describe('FormColetaComponent', () => {
  let component: FormColetaComponent;
  let fixture: ComponentFixture<FormColetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormColetaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormColetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
