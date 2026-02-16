import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeCarroselComponent } from './home-carrosel.component';

describe('HomeCarroselComponent', () => {
  let component: HomeCarroselComponent;
  let fixture: ComponentFixture<HomeCarroselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeCarroselComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeCarroselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
