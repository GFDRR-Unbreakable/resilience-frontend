import { Injectable } from '@angular/core';
import {WebService} from '../services/web.service';
import {SERVER} from '../services/server.conf';
import {Observable} from 'rxjs/Observable';
@Injectable()
export class FileService {
  private baseURL = SERVER.URL.BASE_SERVER + SERVER.URL.SERVER_API;
  private csvURL = SERVER.URL.SERVER_DOWNLOADCSV;
  constructor(private webService: WebService) { }

  getViewerCSVFile(data): Observable<any> {
    const url = `${this.baseURL}${this.csvURL}`;
    return this.webService.post(url, data, this.webService.getJSONOptions())
      .map((res: Response) => res.text()).catch(this.webService.errorHandler);
  }
}
