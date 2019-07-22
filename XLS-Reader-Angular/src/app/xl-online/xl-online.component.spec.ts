import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { XlOnlineComponent } from './xl-online.component';

describe('XlOnlineComponent', () => {
  let component: XlOnlineComponent;
  let fixture: ComponentFixture<XlOnlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ XlOnlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(XlOnlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
