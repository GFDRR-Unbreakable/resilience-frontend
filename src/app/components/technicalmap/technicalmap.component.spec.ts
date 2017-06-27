import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalmapComponent } from './technicalmap.component';

describe('TechnicalmapComponent', () => {
  let component: TechnicalmapComponent;
  let fixture: ComponentFixture<TechnicalmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TechnicalmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TechnicalmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
