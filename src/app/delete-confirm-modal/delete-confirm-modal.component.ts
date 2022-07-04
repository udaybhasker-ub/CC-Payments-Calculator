import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-confirm-modal',
  templateUrl: './delete-confirm-modal.component.html',
  styleUrls: ['./delete-confirm-modal.component.less']
})
export class DeleteConfirmModalComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<DeleteConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

  onContinue() {
    this.dialogRef.close(this.data.name);
  }

}
