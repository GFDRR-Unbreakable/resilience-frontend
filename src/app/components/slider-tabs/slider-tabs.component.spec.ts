import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderTabsComponent } from './slider-tabs.component';

describe('SliderTabsComponent', () => {
  let component: SliderTabsComponent;
  let fixture: ComponentFixture<SliderTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SliderTabsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SliderTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
