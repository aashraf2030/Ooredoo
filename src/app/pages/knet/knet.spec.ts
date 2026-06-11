import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Knet } from './knet';

describe('Knet', () => {
  let component: Knet;
  let fixture: ComponentFixture<Knet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Knet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Knet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
