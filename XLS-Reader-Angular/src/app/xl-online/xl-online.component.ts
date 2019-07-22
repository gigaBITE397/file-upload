import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-xl-online',
  templateUrl: './xl-online.component.html',
  styleUrls: ['./xl-online.component.css']
})
export class XlOnlineComponent implements OnInit {

	public data : any;

  constructor() { }

  ngOnInit() {
  }

  onFileChange(evt: any) {
     /* wire up file reader */
     const target: DataTransfer = <DataTransfer>(evt.target);
     if (target.files.length !== 1) throw new Error('Cannot use multiple files');
     const reader: FileReader = new FileReader();
     reader.onload = (e: any) => {
       /* read workbook */
       const bstr: string = e.target.result;
       const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
       
       /* grab first sheet */
       const wsname: string = wb.SheetNames[0];
       const ws: XLSX.WorkSheet = wb.Sheets[wsname];

       /* save data */
       this.data =(XLSX.utils.sheet_to_json(ws, {header: 1}));

       // To check xls data
       // console.log(this.data);
     };
     reader.readAsBinaryString(target.files[0]);
   }

}
