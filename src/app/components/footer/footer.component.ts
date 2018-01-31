import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  @Input() selection: any;
  constructor() { }
  isChecked = true;
  check() {
    if (this.selection === false) {
      this.isChecked = false;
    }
    if (this.selection && (this.selection[0] || this.selection[1])) {
      this.isChecked = false;
    }
    // console.log(this.isChecked);
    return this.isChecked;
  }
  ngOnInit() {
  }

}
