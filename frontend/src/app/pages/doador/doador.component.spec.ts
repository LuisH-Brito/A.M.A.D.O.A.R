import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoadorComponent } from './doador.component';

describe('DoadorComponent', () => {
  let component: DoadorComponent;
  let fixture: ComponentFixture<DoadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoadorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
