import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestaoPessoalCrudComponent } from './gestao-pessoal-crud.component';

describe('GestaoPessoalCrudComponent', () => {
  let component: GestaoPessoalCrudComponent;
  let fixture: ComponentFixture<GestaoPessoalCrudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoPessoalCrudComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestaoPessoalCrudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
