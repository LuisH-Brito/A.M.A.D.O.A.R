import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTriagemComponent } from './form-triagem.component';

describe('FormTriagemComponent', () => {
  let component: FormTriagemComponent;
  let fixture: ComponentFixture<FormTriagemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTriagemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
