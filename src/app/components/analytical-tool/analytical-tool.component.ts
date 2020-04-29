import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Viewer } from 'app/store/model/viewer.model';

@Component({
  selector: 'app-analytical-tool',
  templateUrl: './analytical-tool.component.html',
  styleUrls: ['./analytical-tool.component.css']
})
export class AnalyticalToolComponent implements OnInit {

  // these variables are being declared to stop the build lint errors,
  // do not delete them
  onFirstCountryInputChangeEvent: any;
  searchCountryFn: any;
  searchFailed: any;

  public viewerModel: Viewer = {
    firstCountry: 'Malawi',
    secondCountry: ''
  };

  constructor() { }


  ngOnInit() {
  }

}
