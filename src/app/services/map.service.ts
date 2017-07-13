import { Injectable } from '@angular/core';
import { Map, MapboxOptions } from 'mapbox-gl';
import * as mapboxgl from 'mapbox-gl';

@Injectable()
export class MapService {
  public token: String
    = 'pk.eyJ1IjoiZ2ZkcnItZGFzaGJvYXJkIiwiYSI6ImNqMnV3MWppdjAwMXUydmxhaG1weTZzaW8ifQ.drORihaTAcJEGLXFSKjvfQ';
  public map: Map;
  constructor() {
    (mapboxgl as any).accessToken = this.token;
  }
  createMap(mapId: string) {
    this.map = new Map({
      container: mapId,
      style: 'mapbox://styles/mapbox/light-v9',
      zoom: 1
    });
  }

}
