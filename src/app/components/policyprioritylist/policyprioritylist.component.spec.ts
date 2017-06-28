import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyprioritylistComponent } from './policyprioritylist.component';

describe('PolicyprioritylistComponent', () => {
  let component: PolicyprioritylistComponent;
  let fixture: ComponentFixture<PolicyprioritylistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PolicyprioritylistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyprioritylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
