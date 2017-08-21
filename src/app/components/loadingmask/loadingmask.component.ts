import { Component, OnInit } from '@angular/core';
import { LoadingMaskService } from '../../services/loadingmask.service';

@Component({
  selector: 'app-loadingmask',
  templateUrl: './loadingmask.component.html',
  styleUrls: ['./loadingmask.component.css']
})
export class LoadingMaskComponent implements OnInit {

  constructor(public loadingMaskService: LoadingMaskService) { }

  ngOnInit() {
  }

}
