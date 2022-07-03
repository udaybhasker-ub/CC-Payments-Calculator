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
  available: number = 9177.50;
  firstTime: boolean = true;
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
  },  {
    name: 'newUsage',
    lable: 'New Usage',
    decorator: '%',
    aggType: 'avg'
  },{
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
    //this.firstTime = false;
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
    console.log('Delete ', entry);
    this.openConfirmDialog(entry.name);
  }

  editCol(entry: Entry) {
    console.log('edit ', entry);
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
      console.log('The dialog was closed', name);
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
      if(en.name === entry.name)
        en.apply = event.checked;
    });
    this.calculate();
  }

  calculate() {
    let balanceTotal = this.dataSource.data.reduce((a: any, b: Entry) => { return a + b.balance; }, 0);

    if (this.available > balanceTotal) {
      this.available = balanceTotal;
    }

    let totalInterest = this.dataSource.data.reduce((a: any, b: Entry) => { return a + b.interestAmount;}, 0);
    let sortedData = this.dataSource.data.sort((a, b) => (b.interestRelPercent) || 0 - (a.interestRelPercent || 0));

    sortedData.forEach((entry, index) => {
      entry.interestRelPercent = (entry.interestAmount! / totalInterest);
      entry.payment = entry.apply ? this.getAdjustedAmount(entry.balance, this.available * entry.interestRelPercent!) : 0;
      entry.paymentPercent = entry.payment / (this.available > balanceTotal ? balanceTotal : this.available);
      entry.newBalance = entry.balance - entry.payment;
      entry.newInterest = entry.newBalance ? (entry.newBalance * entry.apr) / 1200 : 0;
      entry.newUsage = entry.newBalance/entry.limit;
      this.distributetRelPrecentages(sortedData, index, totalInterest, entry.interestRelPercent - entry.paymentPercent);
    });
    this.distributeRemainingBalance(sortedData);
    console.log(this.dataSource.data);
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
      let totalRelPercent: number =  0;
      sortedData.forEach((en: Entry, ind: number) => {
         if(ind >= index) totalRelPercent = en.interestRelPercent!;
      });
      let relRelPercent = nextVal.interestRelPercent!/totalRelPercent;
      this.dataSource.data[index + 1]!.interestRelPercent = relRelPercent * overflow;
      this.distributetRelPrecentages(sortedData, index + 1, totalInterest, (1-relRelPercent) * overflow);
    }
  }

  distributeRemainingBalance(entries: Entry[]) {
    let balanceTotal = this.dataSource.data.reduce((a: any, b: Entry) => { return a + b.balance; }, 0);
    entries.forEach((entry: Entry) => {
      if (entry.payment! < entry.balance && entry.apply) {
        let paymentTotal = this.dataSource.data.reduce((a: any, b: Entry) => { return a + b.payment; }, 0);
        let newPayment = entry.payment! + (this.available - paymentTotal);
        let adjustedPayment = this.getAdjustedAmount(entry.balance, newPayment);
        entry.payment = entry.apply ? adjustedPayment : 0;
        entry.paymentPercent = entry.payment / (this.available > balanceTotal ? balanceTotal : this.available);
        entry.newBalance = entry.balance - entry.payment;
        entry.newInterest = entry.newBalance ? (entry.newBalance * entry.apr) / 1200 : 0;
        entry.newUsage = entry.newBalance/entry.limit;
      }
    });
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      console.log(`Sorted ${sortState.direction}ending`);
    } else {
      console.log('Sorting cleared');
    }
  }

}
