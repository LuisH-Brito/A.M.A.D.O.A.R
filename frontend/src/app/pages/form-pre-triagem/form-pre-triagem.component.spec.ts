import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPreTriagemComponent } from './form-pre-triagem.component';

describe('FormPreTriagemComponent', () => {
  let component: FormPreTriagemComponent;
  let fixture: ComponentFixture<FormPreTriagemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPreTriagemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPreTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
