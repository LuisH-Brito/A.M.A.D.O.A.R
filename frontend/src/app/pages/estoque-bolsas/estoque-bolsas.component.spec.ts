import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstoqueBolsasComponent } from './estoque-bolsas.component';

describe('EstoqueBolsasComponent', () => {
  let component: EstoqueBolsasComponent;
  let fixture: ComponentFixture<EstoqueBolsasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstoqueBolsasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstoqueBolsasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
