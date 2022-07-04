import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EntryDialogComponent } from '../entry-dialog/entry-dialog.component';
import { LocalStorageService } from '../services/local-storage/local-storage.service';
import { Entry } from '../types/Entry.type';
import { CreditEntriesTableComponent } from '../credit-entries-table/credit-entries-table.component';
import { ModalService } from '../services/modal-service/modal.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {

  @ViewChild(CreditEntriesTableComponent) table! : CreditEntriesTableComponent;

  constructor(
    public localStorageService: LocalStorageService, 
    public modalService: ModalService) { }

  ngOnInit(): void {
    
  }

  

  clearStorage(): void {
    this.localStorageService.clear();
  }
}
