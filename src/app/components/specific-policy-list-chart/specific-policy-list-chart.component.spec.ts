import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecificPolicyListChartComponent } from './specific-policy-list-chart.component';

describe('SpecificPolicyListChartComponent', () => {
  let component: SpecificPolicyListChartComponent;
  let fixture: ComponentFixture<SpecificPolicyListChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpecificPolicyListChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecificPolicyListChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
