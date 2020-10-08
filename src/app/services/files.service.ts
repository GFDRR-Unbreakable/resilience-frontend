import { Injectable } from '@angular/core';
import {WebService} from '../services/web.service';
import {SERVER} from '../services/server.conf';
import {Observable} from 'rxjs/Observable';
@Injectable()
export class FileService {
  /**
   * Private properties which holds server urls and endpoints.
   */
  private baseURL = SERVER.URL.BASE_SERVER + SERVER.URL.SERVER_API;
  private csvURL = SERVER.URL.SERVER_DOWNLOADCSV;
  private pdfURL = SERVER.URL.SERVER_DOWNLOADPDF;
  private scPdfURL = SERVER.URL.SERVER_DOWNLOADSCPDF;
  /**
   * Injects web service when this service is initialized by a component
   * @param {WebService} webService - Service which has a custom functionality regarding the HTTP method calls. It uses default
   * @angular/http API configuration for it.
   */
  constructor(private webService: WebService) { }
  /**
   * Returns Scorecard-PDF file from its API endpoint.
   * @param {Object} data - Request body data to build the PDF-file.
   */
  getScorecardPDFFile(data):  Observable<any> {
    const url = `${this.baseURL}${this.scPdfURL}`;
    return this.webService.post(url, data, this.webService.getJSONOptions())
      .map((res: Response) => res['_body']).catch(this.webService.errorHandler);
  }
  /**
   * Returns Viewer-CSV file from its API endpoint.
   * @param {Object} data - Request body data to build the CSV-file.
   */
  getViewerCSVFile(data): Observable<any> {
    const url = `${this.baseURL}${this.csvURL}`;
    return this.webService.post(url, data, this.webService.getJSONOptions())
      .map((res: Response) => res.text()).catch(this.webService.errorHandler);
  }
  /**
   * Returns Viewer/TechnicalMap PDF file from its API endpoint.
   * @param {Object} data - Request body data to build the PDF-file.
   */
  getViewerPDFFile(data): Observable<any> {
    const url = `${this.baseURL}${this.pdfURL}`;
    return this.webService.post(url, data, this.webService.getJSONOptions())
      .map((res: Response) => res['_body']).catch(this.webService.errorHandler);
  }
  /**
   * Reusable snippet code to perform the PDF-file download process
   * @param {any} data - Data returned from API endpoint.
   * @param {String} view - Determines which page is displayed on the app to change its file-name when the file is downloaded.
   */
  setPDFDownloadProcess(data, view) {
    const byteString = window.atob(data);
    // Convert that text into a byte array.
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ia], {
      type: 'application/octet-stream;'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    let fileName;
    if (view === 'countrytool') {
      fileName = 'viewer_report';
    } else if (view === 'tech') {
      fileName = 'technicalMap_report';
    } else if (view === 'scorecardPolicyList') {
      fileName = 'scorecard_priority_list_report';
    } else if (view === 'scorecardPolicyMeasure') {
      fileName = 'scorecard_policy_measure_report';
    }
    a.download = `${fileName}.pdf`;
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  }
}
