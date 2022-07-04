import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Entry } from '../types/Entry.type';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from '../services/local-storage/local-storage.service';
import { ModalService } from '../services/modal-service/modal.service';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-credit-entries-table',
  templateUrl: './credit-entries-table.component.html',
  styleUrls: ['./credit-entries-table.component.less']
})
export class CreditEntriesTableComponent implements OnInit {
  dataSource!: MatTableDataSource<Entry>;
  balance: number = 0;
  available: number = 1000;
  leastInterestMode: boolean = true;
  displayedColumnDefs = [{
    name: 'name',
    lable: 'Name',
    decorator: '',
    aggType: ''
  }, {
    name: 'balance',
    lable: 'Balance',
    decorator: '$',
    aggType: 'sum'
  }, {
    name: 'limit',
    lable: 'Limit',
    decorator: '$',
    aggType: 'sum'
  }, {
    name: 'apr',
    lable: 'APR',
    decorator: '%',
    append: true,
    aggType: 'avg'
  }, {
    name: 'usage',
    lable: 'Usage',
    decorator: '%',
    append: true,
    aggType: 'avg'
  }, {
    name: 'interestAmount',
    lable: 'Interest(Monthly)',
    decorator: '$',
    aggType: 'sum'
  }, {
    name: 'payment',
    lable: 'Payment',
    decorator: '$',
    aggType: 'sum'
  }, {
    name: 'newBalance',
    lable: 'New Balance',
    decorator: '$',
    aggType: 'sum'
  }, {
    name: 'newUsage',
    lable: 'New Usage',
    decorator: '%',
    aggType: 'avg'
  }, {
    name: 'newInterest',
    lable: 'New Interest',
    decorator: '$',
    aggType: 'sum'
  }];
  displayedColumns: string[] = this.displayedColumnDefs.map(item => item.name);
  displayedColumnsWithAction: string[] = ['edit', 'delete', ...this.displayedColumns, 'apply'];
  deleteElement!: Entry | null;

  @ViewChild(MatSort) sort!: MatSort;

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    public localStorageService: LocalStorageService,
    public modalService: ModalService) { }

  ngOnInit(): void {
    this.localStorageService.entries.subscribe((entries: Entry[]) => {
      this.updateDataSource(entries);
    });
  }

  ngAfterViewInit() {
    const entries = this.localStorageService.get();
    this.updateDataSource(entries);
    this.dataSource.sort = this.sort;
    this.cdRef.detectChanges();
  }

  updateDataSource(entries: Entry[]) {
    if (entries) {
      entries.forEach(entry => {
        entry.usage = entry.balance && entry.limit ? (entry.balance / entry.limit) : 0;
        entry.interestAmount = entry.balance && entry.apr ? (entry.balance * entry.apr) / 1200 : 0;
        entry.apply = true;
      });
    }
    this.dataSource = new MatTableDataSource<Entry>(entries);

    if (!this.table)
      return;
    this.table.renderRows();
    this.calculate();
    this.dataSource._updateChangeSubscription();
  }

  add(entry: Entry) {
    this.localStorageService.save(entry);
  }

  remove(name: string) {
    this.localStorageService.delete(name);
  }

  removeCol(entry: Entry) {
    this.openConfirmDialog(entry.name);
  }

  editCol(entry: Entry) {
    this.modalService.openEntryDialog({ entry, type: 'edit' });
  }

  openEntryDialog(): void {
    this.modalService.openEntryDialog({} as Entry);
  }

  openConfirmDialog(name: string): void {
    const dialogRef = this.dialog.open(DeleteConfirmModalComponent, {
      width: '250px',
      data: { name }
    });

    dialogRef.afterClosed().subscribe((name: string) => {
      this.remove(name);
    });
  }

  getTotal(defName: string) {
    const _def = this.displayedColumnDefs.find(item => item.name === defName);
    let val = 0;
    if (_def) {
      val = this.dataSource.data.reduce((a: any, b: any) => {
        return a + b[_def.name];
      }, 0);

      if (_def.aggType === 'avg')
        val /= this.dataSource.data.length;
    }
    return val;
  }

  getMonthlyInterest(def: any) {
    const _def = this.displayedColumnDefs.find(item => item.name === def.name);
    let val = 0;
    if (_def) {
      val = (def.balance + (1 / 12) + def.apr) / 100;
    }
    return val;
  }

  onApplyToggle(entry: Entry, event: MatCheckboxChange) {
    this.dataSource.data.forEach(en => {
      if (en.name === entry.name)
        en.apply = event.checked;
    });
    this.leastInterestMode = false;
    this.calculate();
  }

  calculate() {
    let val = this.available;
    if (this.leastInterestMode && this.available)
      val = this.calculateLeast();
    else
      val = this.calculateData(this.dataSource.data, this.available);

    this.available = val;
  }

  calculateData(data: Entry[], available: number): number {
    let balanceTotal = data.reduce((a: any, b: Entry) => { return a + b.balance; }, 0);

    if (available > balanceTotal) {
      available = balanceTotal;
    }

    let totalInterest = data.reduce((a: any, b: Entry) => { return a + b.interestAmount; }, 0);
    let sortedData = data.sort((a, b) => (b.interestRelPercent) || 0 - (a.interestRelPercent || 0));

    sortedData.forEach((entry, index) => {
      entry.interestRelPercent = (entry.interestAmount! / totalInterest);
      entry.payment = entry.apply ? this.getAdjustedAmount(entry.balance, available * entry.interestRelPercent!) : 0;
      entry.paymentPercent = entry.payment / (available > balanceTotal ? balanceTotal : available);
      entry.newBalance = entry.balance - entry.payment;
      entry.newInterest = entry.newBalance ? (entry.newBalance * entry.apr) / 1200 : 0;
      entry.newUsage = entry.newBalance / entry.limit;
      this.distributetRelPrecentages(sortedData, index, totalInterest, entry.interestRelPercent - entry.paymentPercent);
    });
    this.distributeRemainingBalance(sortedData, available);
    return available;
  }

  getAdjustedAmount(balance: number, payment: number) {
    let resultPayment = payment;
    if (payment > balance) {
      resultPayment = balance;
    }
    return resultPayment;
  }

  distributetRelPrecentages(sortedData: Entry[], index: number, totalInterest: number, overflow: number) {
    if (overflow && index + 1 < this.dataSource.data.length) {
      let nextVal = this.dataSource.data[index + 1];
      let nextRelPercent = (nextVal.interestAmount! / totalInterest);
      let totalRelPercent: number = 0;
      sortedData.forEach((en: Entry, ind: number) => {
        if (ind >= index) totalRelPercent = en.interestRelPercent!;
      });
      let relRelPercent = nextVal.interestRelPercent! / totalRelPercent;
      this.dataSource.data[index + 1]!.interestRelPercent = relRelPercent * overflow;
      this.distributetRelPrecentages(sortedData, index + 1, totalInterest, (1 - relRelPercent) * overflow);
    }
  }

  distributeRemainingBalance(entries: Entry[], available: number) {
    let balanceTotal = entries.reduce((a: any, b: Entry) => { return a + b.balance; }, 0);
    entries.forEach((entry: Entry) => {
      if (entry.payment! < entry.balance && entry.apply) {
        let paymentTotal = entries.reduce((a: any, b: Entry) => { return a + b.payment; }, 0);
        let newPayment = entry.payment! + (available - paymentTotal);
        let adjustedPayment = this.getAdjustedAmount(entry.balance, newPayment);
        entry.payment = entry.apply ? adjustedPayment : 0;
        entry.paymentPercent = entry.payment / (available > balanceTotal ? balanceTotal : available);
        entry.newBalance = entry.balance - entry.payment;
        entry.newInterest = entry.newBalance ? (entry.newBalance * entry.apr) / 1200 : 0;
        entry.newUsage = entry.newBalance / entry.limit;
      }
    });
  }

  calculateLeast() {
    let data = [...this.dataSource.data];
    let samples = 20;
    let totalBalance = data.reduce((a: any, b: Entry) => { return a + b.balance; }, 0);
    let avail = this.available;

    if (avail > totalBalance) {
      avail = totalBalance;
    }
    let n = data.length;
    let binary = this.generateStates(n);

    let lowestIntData: any = [];
    let lowestInt = avail;
    let lowestBinary: string[] = [];

    binary.forEach((item) => {
      let binArr = item.match(/.{1}/g);
      let c = 0;
      binArr && data.forEach(entry => {
        entry.apply = binArr![c] === '1';
        c++;
      });
      this.calculateData(data, avail);
      let newInterest = data.reduce((a: any, b: Entry) => { return a + b.newInterest; }, 0);
      if (newInterest < lowestInt) {
        lowestIntData = data.map(a => ({ ...a }));
        lowestInt = newInterest;
        lowestBinary = binArr!;
      }
    });
    this.dataSource.data = lowestIntData;
    return avail;
  }

  generateStates(n: number) {
    var states = [];

    var maxDecimal = parseInt("1".repeat(n), 2);

    for (var i = 0; i <= maxDecimal; i++) {
      states.push(i.toString(2).padStart(n, '0'));
    }

    return states;
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
    } else {
    }
  }

}
