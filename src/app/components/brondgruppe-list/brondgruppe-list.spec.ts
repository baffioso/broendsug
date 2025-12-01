import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrondgruppeList } from './brondgruppe-list';

describe('BrondgruppeList', () => {
  let component: BrondgruppeList;
  let fixture: ComponentFixture<BrondgruppeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrondgruppeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrondgruppeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
