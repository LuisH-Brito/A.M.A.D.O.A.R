import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionarioResultadoComponent } from './questionario-resultado.component';

describe('QuestionarioResultadoComponent', () => {
  let component: QuestionarioResultadoComponent;
  let fixture: ComponentFixture<QuestionarioResultadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionarioResultadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionarioResultadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
