import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Input, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
  }

}
