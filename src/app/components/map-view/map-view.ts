import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { effect } from '@angular/core';
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
  private readonly injector = inject(Injector);
  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map?: maplibregl.Map;
  private readonly mapLoaded = signal(false);
  private hasZoomedToInitialBounds = false;

  // Layer visibility signals
  protected readonly showAnlaegsprojekter = signal(false);
  protected readonly showRaadenOverVej = signal(false);

  constructor() {
    effect(() => {
      const selected = this.dataService.selectedClusterId();
      if (this.map && this.mapLoaded()) {
        if (selected != null) {
          this.zoomToCluster(selected);
          if (this.map.getLayer('brondgrupper-selected-fill')) {
            this.map.setFilter('brondgrupper-selected-fill', ['==', ['get', 'id'], selected]);
          }
          if (this.map.getLayer('brondgrupper-selected-outline')) {
            this.map.setFilter('brondgrupper-selected-outline', ['==', ['get', 'id'], selected]);
          }
        } else {
          if (this.map.getLayer('brondgrupper-selected-fill')) {
            this.map.setFilter('brondgrupper-selected-fill', ['==', ['get', 'id'], -1]);
          }
          if (this.map.getLayer('brondgrupper-selected-outline')) {
            this.map.setFilter('brondgrupper-selected-outline', ['==', ['get', 'id'], -1]);
          }
        }
      }
    });

    // Effect to toggle anlægsprojekter layer visibility
    effect(() => {
      const visible = this.showAnlaegsprojekter();
      const filter = this.dataService.filter();

      if (this.map && this.mapLoaded()) {
        if (visible) {
          if (!this.map.getLayer('anlaegsprojekter-fill')) {
            this.map.addLayer({
              id: 'anlaegsprojekter-fill',
              type: 'fill',
              source: 'anlaegsprojekter',
              paint: {
                'fill-color': '#ff0000',
                'fill-opacity': 0.3,
              },
            });
          }
          if (!this.map.getLayer('anlaegsprojekter-line')) {
            this.map.addLayer({
              id: 'anlaegsprojekter-line',
              type: 'line',
              source: 'anlaegsprojekter',
              paint: {
                'line-color': '#ff0000',
                'line-width': 2,
              },
            });
          }

          // Apply date filter if present
          if (filter.dateRange) {
            const { start, end } = filter.dateRange;
            const conditions: any[] = ['all'];

            if (start) {
              // Project end must be >= Filter start (or null)
              // Using pv_ibrugtagning as end date
              conditions.push([
                'any',
                ['!', ['has', 'pv_ibrugtagning']],
                ['>=', ['get', 'pv_ibrugtagning'], start.toISOString()]
              ]);
            }

            if (end) {
              // Project start must be <= Filter end (or null)
              // Using pv_projekt_start as start date
              conditions.push([
                'any',
                ['!', ['has', 'pv_projekt_start']],
                ['<=', ['get', 'pv_projekt_start'], end.toISOString()]
              ]);
            }

            if (conditions.length > 1) {
              this.map.setFilter('anlaegsprojekter-fill', conditions as maplibregl.FilterSpecification);
              this.map.setFilter('anlaegsprojekter-line', conditions as maplibregl.FilterSpecification);
            } else {
              this.map.setFilter('anlaegsprojekter-fill', null);
              this.map.setFilter('anlaegsprojekter-line', null);
            }
          } else {
            this.map.setFilter('anlaegsprojekter-fill', null);
            this.map.setFilter('anlaegsprojekter-line', null);
          }

        } else {
          if (this.map.getLayer('anlaegsprojekter-line')) {
            this.map.removeLayer('anlaegsprojekter-line');
          }
          if (this.map.getLayer('anlaegsprojekter-fill')) {
            this.map.removeLayer('anlaegsprojekter-fill');
          }
        }
      }
    });

    // Effect to toggle råden over vej layer visibility
    effect(() => {
      const visible = this.showRaadenOverVej();
      const filter = this.dataService.filter();

      if (this.map && this.mapLoaded()) {
        if (visible) {
          if (!this.map.getLayer('raaden-over-vej-fill')) {
            this.map.addLayer({
              id: 'raaden-over-vej-fill',
              type: 'fill',
              source: 'raaden_over_vej',
              paint: {
                'fill-color': '#0000ff',
                'fill-opacity': 0.3,
              },
            });
          }
          if (!this.map.getLayer('raaden-over-vej-line')) {
            this.map.addLayer({
              id: 'raaden-over-vej-line',
              type: 'line',
              source: 'raaden_over_vej',
              paint: {
                'line-color': '#0000ff',
                'line-width': 2,
              },
            });
          }

          // Apply date filter if present
          if (filter.dateRange) {
            const { start, end } = filter.dateRange;
            const conditions: any[] = ['all'];

            if (start) {
              // Project end must be >= Filter start (or null)
              conditions.push([
                'any',
                ['!', ['has', 'projekt_slut']],
                ['==', ['get', 'projekt_slut'], null],
                ['>=', ['get', 'projekt_slut'], start.toISOString()]
              ]);
            }

            if (end) {
              // Project start must be <= Filter end (or null)
              conditions.push([
                'any',
                ['!', ['has', 'projekt_start']],
                ['==', ['get', 'projekt_start'], null],
                ['<=', ['get', 'projekt_start'], end.toISOString()]
              ]);
            }

            if (conditions.length > 1) {
              this.map.setFilter('raaden-over-vej-fill', conditions as maplibregl.FilterSpecification);
              this.map.setFilter('raaden-over-vej-line', conditions as maplibregl.FilterSpecification);
            } else {
              this.map.setFilter('raaden-over-vej-fill', null);
              this.map.setFilter('raaden-over-vej-line', null);
            }
          } else {
            this.map.setFilter('raaden-over-vej-fill', null);
            this.map.setFilter('raaden-over-vej-line', null);
          }

        } else {
          if (this.map.getLayer('raaden-over-vej-line')) {
            this.map.removeLayer('raaden-over-vej-line');
          }
          if (this.map.getLayer('raaden-over-vej-fill')) {
            this.map.removeLayer('raaden-over-vej-fill');
          }
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    // Initialize map centered on Copenhagen
    this.map = new maplibregl.Map({
      container: this.mapContainer().nativeElement,
      style: 'https://api.maptiler.com/maps/0199d392-bb1b-7927-8f94-3d5e6557f760/style.json?key=tiNMCb9CgsMttr9UGj47',
      center: [12.5683, 55.6761], // Copenhagen coordinates
      zoom: 15,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    this.map.on('load', () => {
      this.addDataLayers();
      this.mapLoaded.set(true);
    });
  }

  private addDataLayers(): void {
    if (!this.map) return;

    // Add Anlægsprojekter source
    this.map.addSource('anlaegsprojekter', {
      type: 'geojson',
      data: 'https://wfs-kbhkort.kk.dk/k101/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=k101%3Aanlaegsprojekter&outputFormat=application%2Fjson&srsName=EPSG:4326',
    });

    this.map.addSource('raaden_over_vej', {
      type: 'geojson',
      data: 'https://wfs-kbhkort.kk.dk/k101/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=k101%3Araaden_over_vej_events_anonym_aktuelt&outputFormat=application%2Fjson&srsName=EPSG:4326',
    });

    // Add GeoJSON source without clustering
    this.map.addSource('broende', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    // Add brondgrupper polygon source
    this.map.addSource('brondgrupper', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Group fill layer with color matching points and opacity transition
    this.map.addLayer({
      id: 'brondgrupper-fill',
      type: 'fill',
      source: 'brondgrupper',
      paint: {
        'fill-color': [
          'match',
          ['%', ['coalesce', ['get', 'color_index'], 0], 12],
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
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13, 0.25,
          16, 0.18,
          17, 0.0
        ],
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
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13, 0.7,
          16, 0.4,
          17, 0.0
        ],
      },
    });

    // Selected Group Fill - Always visible regardless of zoom
    this.map.addLayer({
      id: 'brondgrupper-selected-fill',
      type: 'fill',
      source: 'brondgrupper',
      paint: {
        'fill-color': [
          'match',
          ['%', ['coalesce', ['get', 'color_index'], 0], 12],
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
        'fill-opacity': 0.5, // Fixed opacity
      },
      filter: ['==', ['get', 'id'], -1] // Initially hide
    });

    // Selected Group Outline - Always visible regardless of zoom
    this.map.addLayer({
      id: 'brondgrupper-selected-outline',
      type: 'line',
      source: 'brondgrupper',
      paint: {
        'line-color': '#000000',
        'line-width': 3,
      },
      filter: ['==', ['get', 'id'], -1] // Initially hide
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
        'circle-stroke-width': 0.5,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13, 0.0,
          16, 0.18,
          17, 1.0
        ],
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

    // Add click handler for anlægsprojekter
    this.map.on('click', 'anlaegsprojekter-fill', (e) => {
      if (!e.features || e.features.length === 0) return;

      const props = e.features[0].properties;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="padding: 0.5rem; max-width: 300px;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem;">${props['navn'] || 'Anlægsprojekt'}</h3>
            <p style="margin: 0; font-size: 0.75rem; color: #666;">ID: ${props['projektid']}</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #666;">Status: ${props['pv_projekt_status']}</p>
            ${props['pv_om_projekt'] ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.75rem;">${props['pv_om_projekt']}</p>` : ''}
          </div>
        `
        )
        .addTo(this.map!);
    });

    // Change cursor on hover for anlægsprojekter
    this.map.on('mouseenter', 'anlaegsprojekter-fill', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'anlaegsprojekter-fill', () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });

    // Add click handler for råden over vej
    this.map.on('click', 'raaden-over-vej-fill', (e) => {
      if (!e.features || e.features.length === 0) return;

      const props = e.features[0].properties;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="padding: 0.5rem; max-width: 300px;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem;">${props['sagstype'] || 'Råden over vej'}</h3>
            <p style="margin: 0; font-size: 0.75rem; color: #666;">Kategori: ${props['kategori']}</p>
            <p style="margin: 0; font-size: 0.75rem; color: #666;">Start: ${props['projekt_start']}</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #666;">Slut: ${props['projekt_slut']}</p>
          </div>
        `
        )
        .addTo(this.map!);
    });

    // Change cursor on hover for råden over vej
    this.map.on('mouseenter', 'raaden-over-vej-fill', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'raaden-over-vej-fill', () => {
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

    // Zoom to bounds of all points if not already zoomed
    if (!this.hasZoomedToInitialBounds && features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      features.forEach((f) => {
        bounds.extend(f.geometry.coordinates as [number, number]);
      });
      this.map.fitBounds(bounds, { padding: 50 });
      this.hasZoomedToInitialBounds = true;
    }

    // Update brondgrupper polygons
    const gruppeSource = this.map.getSource('brondgrupper') as maplibregl.GeoJSONSource;
    if (gruppeSource) {
      const fc: FeatureCollection<Polygon> = this.dataService.brondgrupperGeoJSON();
      gruppeSource.setData(fc as any);
    }
  }

  // Helper: fit map to a group's polygon bounds by cluster id
  zoomToCluster(clusterId: number): void {
    console.log('zoomToCluster called with clusterId:', clusterId);
    if (!this.map) {
      console.warn('zoomToCluster: map not initialized');
      return;
    }

    // Query brondgrupperGeoJSON directly from the service
    const fc = this.dataService.brondgrupperGeoJSON();
    const target = fc.features.find((f) => f.properties?.['id'] === clusterId);
    if (!target) {
      console.warn('No polygon found for cluster_id:', clusterId, 'Available ids:', fc.features.map(f => f.properties?.['id']));
      return;
    }

    // Extract all coordinates from the polygon (flatten the ring arrays)
    const allCoords: number[][] = [];
    for (const ring of target.geometry.coordinates) {
      for (const coord of ring) {
        allCoords.push(coord as number[]);
      }
    }
    if (!allCoords.length) return;

    const lons = allCoords.map((c) => c[0]);
    const lats = allCoords.map((c) => c[1]);
    const minX = Math.min(...lons);
    const maxX = Math.max(...lons);
    const minY = Math.min(...lats);
    const maxY = Math.max(...lats);

    this.map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ],
      { padding: 100}
    );
  }
}
