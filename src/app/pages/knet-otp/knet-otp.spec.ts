import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnetOtp } from './knet-otp';

describe('KnetOtp', () => {
  let component: KnetOtp;
  let fixture: ComponentFixture<KnetOtp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnetOtp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KnetOtp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
