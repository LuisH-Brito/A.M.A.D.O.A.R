import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HemometroComponent } from './hemometro.component';

describe('HemometroComponent', () => {
  let component: HemometroComponent;
  let fixture: ComponentFixture<HemometroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HemometroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HemometroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
