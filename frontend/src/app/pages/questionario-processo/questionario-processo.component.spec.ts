import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionarioProcessoComponent } from './questionario-processo.component';

describe('QuestionarioProcessoComponent', () => {
  let component: QuestionarioProcessoComponent;
  let fixture: ComponentFixture<QuestionarioProcessoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionarioProcessoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionarioProcessoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
