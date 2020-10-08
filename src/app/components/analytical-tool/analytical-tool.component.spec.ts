import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticalToolComponent } from './analytical-tool.component';

describe('AnalyticalToolComponent', () => {
  let component: AnalyticalToolComponent;
  let fixture: ComponentFixture<AnalyticalToolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalyticalToolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticalToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
