import { Component, OnInit, Input } from '@angular/core';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css']
})
export class PrintComponent implements OnInit {
  private show = false;

  @Input() countryData: any;
  @Input() chartConf: any;
  @Input() gaugeData: any;
  @Input() gaugeChangeData: any;
  @Input() inputLabels: any;
  @Input() selectedCountry = '';
  @Input() selectedCountryName = '';
  @Input() showPolicy = false;
  @Input() sliderValues1: any;
  @Input() onSliderChangeEvent1: Function;
  @Input() onSliderInputEventAlt: Function;
  @Input() switchValue = 'focus';
  @Input() viewerDisplay = 'viewer';
  @Input() viewerGroupModel: any;
  @Input() viewerModel: any;
  @Input() selectedRegionUIList: any;
  @Input() selectedPolicyUIList: any;

  constructor() { }

  ngOnInit() {
  }

  screenshot() {
    this.show = true;
    setTimeout(() => {
      const element = document.getElementById('print');
      const title = this.viewerDisplay === 'specific-policy' ? `specific-policy.pdf` : `${this.viewerDisplay}-${this.selectedCountry.toLowerCase()}.pdf`;

      const canvasOpts = {
        scrollY: scrollY * -1,
        dpi: 300,
        scale: 2,
      };

      html2canvas(element, canvasOpts).then((canvas) => {
        const img = canvas.toDataURL("image/png");
        const doc = new jsPDF({unit: 'px', format: 'letter'});
        const imgProps = doc.getImageProperties(img);

        doc.addImage(img, 'PNG', 10, 10, imgProps.width/4, imgProps.height/4);
        doc.save(title);
        this.show = false;
      });
    }, 400);
  }
}
