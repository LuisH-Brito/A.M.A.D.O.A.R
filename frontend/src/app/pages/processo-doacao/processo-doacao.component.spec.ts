import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessoDoacaoComponent } from './processo-doacao.component';

describe('ProcessoDoacaoComponent', () => {
  let component: ProcessoDoacaoComponent;
  let fixture: ComponentFixture<ProcessoDoacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessoDoacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessoDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
