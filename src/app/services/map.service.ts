import { Injectable } from '@angular/core';
import { Map, MapboxOptions } from 'mapbox-gl';
import * as mapboxgl from 'mapbox-gl';
import VectorSource = mapboxgl.VectorSource;

@Injectable()
export class MapService {
  public token: String
    = 'pk.eyJ1IjoiZ2ZkcnItZGFzaGJvYXJkIiwiYSI6ImNqMnV3MWppdjAwMXUydmxhaG1weTZzaW8ifQ.drORihaTAcJEGLXFSKjvfQ';
  public map: Map;
  private _sourceId = 'dashboard';
  private _layerId = 'all-country';
  private _layerSource = 'gfdrr-7hi00u';
  private _sourceMapUrl = 'mapbox://gfdrr-dashboard.b9bmqe5r';
  constructor() {
    (mapboxgl as any).accessToken = this.token;
  }
  addBasemap() {
    this.map.addSource(this._sourceId, {
      type: 'vector',
      url: this._sourceMapUrl
    } as VectorSource);
    this.addVectorFillFromUrl({
      id: this._sourceId,
      layer: this._layerSource
    }, {
      layerId: this._layerId,
      paint: {
        'fill-color': this.getMapPaintConf('socio'),
        'fill-opacity': 0.65
      }
    });
  }
  addStylesOnMapLoading(cb: Function) {
    this.map.on('style.load', cb);
  }
  addVectorFillFromUrl(sourceParams: any, mapParams: any) {
    const params = this.getVectorFillParams(sourceParams, mapParams);
    sourceParams = params.source;
    mapParams = params.map;
    if (sourceParams.hasSource) {
      this.map.addSource(sourceParams.id, {
        'type': 'vector',
        'url': sourceParams.url
      } as VectorSource) ;
    }
    const layerObj: mapboxgl.Layer = {
      'id': mapParams.layerId,
      'type': 'fill',
      'interactive': true,
      'source': sourceParams.id,
      'source-layer': sourceParams.layer,
      'paint': mapParams.paint
    };
    if (mapParams.filter) {
      layerObj.filter = mapParams.filter;
    }
    this.map.addLayer(layerObj);
  }
  changeLayerStyle(params: any) {
    const styleProp = params.property;
    const layerStyle = this.getMapPaintConf(params.type);
    this.map.setPaintProperty(this._layerId, styleProp, layerStyle);
  }
  createMap(mapId: string) {
    this.map = new Map({
      container: mapId,
      style: 'mapbox://styles/gfdrr-dashboard/cj59tfxrb686y2sp97c40f56d',
      center: [0, 15],
      zoom: 0.95
    });
  }
  getMap() {
    return this.map;
  }
  getMapPaintConf(type: string) {
    const mapStyleConf = {
      asset: {
        property: '1_Assets',
        stops: [
          [0, '#deebf7'],
          [0.051, '#9ecae1'],
          [0.11, '#4292c6'],
          [0.151, '#2171b5'],
          [0.21, '#08306b'],
        ]
      },
      socio: {
        property: '2_SocEcon',
        stops: [
          [0, '#deebf7'],
          [0.21, '#9ecae1'],
          [0.41, '#4292c6'],
          [0.61, '#2171b5'],
          [0.81, '#08306b'],
        ]
      },
      well: {
        property: '3_WeBeing',
        stops: [
          [0, '#deebf7'],
          [0.11, '#9ecae1'],
          [0.21, '#4292c6'],
          [0.31, '#2171b5'],
          [0.41, '#08306b'],
        ]
      }
    };
    return mapStyleConf[type];
  }
  getVectorFillParams(sourceParams, mapParams) {
    const defaultSourceParams: any = {
      id: <string> null,
      layer: <string> null,
      hasSource: <boolean> false,
      url: <string> null
    };
    const defaultMapParams: any = {
      layerId: <string> null,
      filter: <any> null,
      paint: <any> null
    };
    return {
      source: Object.assign({}, defaultSourceParams, sourceParams),
      map: Object.assign({}, defaultMapParams, mapParams)
    };
  }
}
