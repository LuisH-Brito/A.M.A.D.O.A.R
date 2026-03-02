import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessoDoacaoMedComponent } from './processo-doacao-med.component';

describe('ProcessoDoacaoMedComponent', () => {
  let component: ProcessoDoacaoMedComponent;
  let fixture: ComponentFixture<ProcessoDoacaoMedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessoDoacaoMedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessoDoacaoMedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
