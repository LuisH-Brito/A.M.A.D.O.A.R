import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra Cadastrar Doador somente para recepcionista', () => {
    localStorage.setItem('access', 'token');
    localStorage.setItem('cargo', 'recepcionista');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cadastrar Doador');

    for (const cargo of ['doador', 'medico', 'enfermeiro']) {
      localStorage.setItem('cargo', cargo);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Cadastrar Doador');
    }
    localStorage.removeItem('access');
    localStorage.removeItem('cargo');
  });
});
