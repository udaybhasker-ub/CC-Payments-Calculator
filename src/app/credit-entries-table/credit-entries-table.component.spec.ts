import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditEntriesTableComponent } from './credit-entries-table.component';

describe('CreditEntriesTableComponent', () => {
  let component: CreditEntriesTableComponent;
  let fixture: ComponentFixture<CreditEntriesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditEntriesTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditEntriesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
