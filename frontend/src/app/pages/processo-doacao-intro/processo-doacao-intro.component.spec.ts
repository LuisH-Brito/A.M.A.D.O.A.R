import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessoDoacaoIntroComponent } from './processo-doacao-intro.component';

describe('ProcessoDoacaoIntroComponent', () => {
  let component: ProcessoDoacaoIntroComponent;
  let fixture: ComponentFixture<ProcessoDoacaoIntroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessoDoacaoIntroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessoDoacaoIntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
