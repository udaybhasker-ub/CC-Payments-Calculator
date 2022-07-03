import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EntryDialogComponent } from 'src/app/entry-dialog/entry-dialog.component';
import { Entry } from 'src/app/types/Entry.type';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor(public dialog: MatDialog,) { }

  openEntryDialog(data: any): void {
    const dialogRef = this.dialog.open(EntryDialogComponent, {
      width: '250px',
      data
    });
  }
}
