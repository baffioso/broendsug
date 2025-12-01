import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as maplibregl from 'maplibre-gl';
import { BrondDataService } from '../../services';
import { FeatureCollection, Polygon } from 'geojson';

@Component({
  selector: 'app-map-view',
  imports: [],
  templateUrl: './map-view.html',
  styleUrl: './map-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapView implements AfterViewInit {
  private readonly dataService = inject(BrondDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map?: maplibregl.Map;

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    // Initialize map centered on Copenhagen
    this.map = new maplibregl.Map({
      container: this.mapContainer().nativeElement,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [12.5683, 55.6761], // Copenhagen coordinates
      zoom: 13,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    this.map.on('load', () => {
      this.addDataLayers();
    });
  }

  private addDataLayers(): void {
    if (!this.map) return;

    // Add GeoJSON source without clustering
    this.map.addSource('broende', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    // Individual well points colored by cluster_id
    this.map.addLayer({
      id: 'broende-point',
      type: 'circle',
      source: 'broende',
      paint: {
        'circle-color': [
          'match',
          ['%', ['coalesce', ['to-number', ['get', 'cluster_id']], 0], 12],
          0, '#1f77b4',
          1, '#ff7f0e',
          2, '#2ca02c',
          3, '#d62728',
          4, '#9467bd',
          5, '#8c564b',
          6, '#e377c2',
          7, '#7f7f7f',
          8, '#bcbd22',
          9, '#17becf',
          10, '#e41a1c',
          11, '#4daf4a',
          '#1f77b4',
        ],
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    // Add brøndgrupper polygon source
    this.map.addSource('brondgrupper', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Group fill layer
    this.map.addLayer({
      id: 'brondgrupper-fill',
      type: 'fill',
      source: 'brondgrupper',
      paint: {
        'fill-color': [
          'match',
          ['coalesce', ['get', 'color_index'], 0],
          0, '#1f77b4',
          1, '#ff7f0e',
          2, '#2ca02c',
          3, '#d62728',
          4, '#9467bd',
          5, '#8c564b',
          6, '#e377c2',
          7, '#7f7f7f',
          8, '#bcbd22',
          9, '#17becf',
          10, '#e41a1c',
          11, '#4daf4a',
          '#1f77b4',
        ],
        'fill-opacity': 0.15,
      },
    });

    // Group outline layer
    this.map.addLayer({
      id: 'brondgrupper-outline',
      type: 'line',
      source: 'brondgrupper',
      paint: {
        'line-color': '#333',
        'line-width': 1,
      },
    });

    // Add click handler for individual wells
    this.map.on('click', 'broende-point', (e) => {
      if (!e.features || e.features.length === 0) return;

      const coordinates = (e.features[0].geometry as any).coordinates.slice();
      const props = e.features[0].properties;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(
          `
          <div style="padding: 0.5rem;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem;">${props['vej_navn']}</h3>
            <p style="margin: 0; font-size: 0.75rem; color: #666;">ID: ${props['id']}</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #666;">Status: ${props['objekt_status']}</p>
          </div>
        `
        )
        .addTo(this.map!);
    });

    // Change cursor on hover for points
    this.map.on('mouseenter', 'broende-point', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'broende-point', () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });

    // Update map data when brøndgrupper change
    this.updateMapData();
  }

  private updateMapData(): void {
    if (!this.map) return;

    const source = this.map.getSource('broende') as maplibregl.GeoJSONSource;
    if (!source) return;

    // Convert brøndgrupper to GeoJSON features
    const features = this.dataService
      .brondgrupper()
      .flatMap((gruppe) =>
        gruppe.broende.map((brond) => ({
          type: 'Feature' as const,
          properties: {
            id: brond.id,
            vej_navn: brond.vejNavn,
            vej_kode: brond.vejKode,
            objekt_status: brond.objektStatus,
            cluster_id: brond.clusterId,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [brond.longitude, brond.latitude],
          },
        }))
      );

    source.setData({
      type: 'FeatureCollection',
      features: features,
    });

    // Update brøndgrupper polygons
    const gruppeSource = this.map.getSource('brondgrupper') as maplibregl.GeoJSONSource;
    if (gruppeSource) {
      const fc: FeatureCollection<Polygon> = this.dataService.brondgrupperGeoJSON();
      gruppeSource.setData(fc as any);
    }
  }

  // Helper: fit map to a group's polygon bounds by vejKode
  zoomToGroup(vejKode: string): void {
    if (!this.map) return;
    const features = this.map.querySourceFeatures('brondgrupper');
    const target = features.find((f) => f.properties && f.properties['id'] === vejKode);
    if (!target) return;

    const geom = target.geometry as any;
    const coords = geom.coordinates.flat(2);
    const lons = coords.map((c: number[]) => c[0]);
    const lats = coords.map((c: number[]) => c[1]);
    const minX = Math.min(...lons);
    const maxX = Math.max(...lons);
    const minY = Math.min(...lats);
    const maxY = Math.max(...lats);
    this.map.fitBounds([
      [minX, minY],
      [maxX, maxY],
    ], { padding: 40, duration: 600 });
  }
}
