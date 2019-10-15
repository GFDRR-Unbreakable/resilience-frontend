import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.css']
})
export class SwitchComponent implements OnInit {
  idSuffix: string[] = [`${Math.random()}`, `${Math.random()}`];
  @Input() value: string = 'value-a';
  @Input() options: string[] = ['value-a', 'value-b'];
  @Input() labels: string[] = ['Frist', 'Second'];
  @Output() onChange = new EventEmitter();

  constructor() { }

  ngOnInit() {
    console.log('this', this)
  }

  switchChange(value) {
    if (value !== this.value) {
      this.value = value;
      this.onChange.emit(value);
    }
  }

}
