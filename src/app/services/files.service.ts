import { Injectable } from '@angular/core';
import {WebService} from '../services/web.service';
import {SERVER} from '../services/server.conf';
import {Observable} from 'rxjs/Observable';
@Injectable()
export class FileService {
  private baseURL = SERVER.URL.BASE_SERVER + SERVER.URL.SERVER_API;
  private csvURL = SERVER.URL.SERVER_DOWNLOADCSV;
  private pdfURL = SERVER.URL.SERVER_DOWNLOADPDF;
  constructor(private webService: WebService) { }

  getViewerCSVFile(data): Observable<any> {
    const url = `${this.baseURL}${this.csvURL}`;
    return this.webService.post(url, data, this.webService.getJSONOptions())
      .map((res: Response) => res.text()).catch(this.webService.errorHandler);
  }
  getViewerPDFFile(data): Observable<any> {
    const url = `${this.baseURL}${this.pdfURL}`;
    return this.webService.post(url, data, this.webService.getJSONOptions())
      .map((res: Response) => res['_body']).catch(this.webService.errorHandler);
  }
}
