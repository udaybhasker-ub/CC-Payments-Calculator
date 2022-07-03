import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Entry } from '../types/Entry.type';
import { LocalStorageService } from '../services/local-storage/local-storage.service';
import { Data } from '@angular/router';
import { ModalService } from '../services/modal-service/modal.service';

@Component({
  selector: 'app-entry-dialog',
  templateUrl: './entry-dialog.component.html',
  styleUrls: ['./entry-dialog.component.less']
})
export class EntryDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<EntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public localStorageService: LocalStorageService) { }

  addEntryForm = new FormGroup({
    name: new FormControl(this.data?.entry?.name || '', Validators.required),
    limit: new FormControl(this.data?.entry?.limit || '', Validators.required),
    apr: new FormControl(this.data?.entry?.apr || '', Validators.required),
    balance: new FormControl(this.data?.entry?.balance || '', Validators.required)
  });

  errorStatus: number = 0;

  ngOnInit(): void {
  }

  onSubmit() {
    if (this.addEntryForm.invalid) {
      return;
    }



    try{

      const entry: Entry = {
        name: this.addEntryForm.get('name')?.value!,
        limit: parseFloat(this.addEntryForm.get('limit')?.value!),
        apr: parseFloat(this.addEntryForm.get('apr')?.value!),
        balance: parseFloat(this.addEntryForm.get('balance')?.value!)
      }
  
  
      if (this.data && this.data.type === 'edit') {
        this.errorStatus = this.localStorageService.edit(entry)! ? 0 : 2;
      } else {
        this.errorStatus = this.localStorageService.save(entry)! ? 0 : 1;
      }
  
    } catch(err) {
      console.error(err);
      this.errorStatus = 3;
    }

    
    if (this.errorStatus < 1) {
      this.dialogRef.close();
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
