import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecificpolicymeasureComponent } from './specificpolicymeasure.component';

describe('SpecificpolicymeasureComponent', () => {
  let component: SpecificpolicymeasureComponent;
  let fixture: ComponentFixture<SpecificpolicymeasureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpecificpolicymeasureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecificpolicymeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
