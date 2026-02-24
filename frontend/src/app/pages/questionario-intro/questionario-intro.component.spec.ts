import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionarioIntroComponent } from './questionario-intro.component';

describe('QuestionarioIntroComponent', () => {
  let component: QuestionarioIntroComponent;
  let fixture: ComponentFixture<QuestionarioIntroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionarioIntroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionarioIntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
