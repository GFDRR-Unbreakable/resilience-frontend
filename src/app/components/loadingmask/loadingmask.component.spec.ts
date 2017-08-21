import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingmaskComponent } from './loadingmask.component';

describe('LoadingmaskComponent', () => {
  let component: LoadingmaskComponent;
  let fixture: ComponentFixture<LoadingmaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadingmaskComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingmaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
