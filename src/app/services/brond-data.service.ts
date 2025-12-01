import { Injectable, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import concave from '@turf/concave';
import convex from '@turf/convex';
import { bbox as turfBbox } from '@turf/bbox';
import { point as turfPoint, featureCollection as turfFeatureCollection } from '@turf/helpers';
import {
	Brond,
	BrondFeature,
	Brondgruppe,
	BrondgruppeFilter,
	BrondgruppeStatistik,
} from '../models';

@Injectable({
	providedIn: 'root',
})
export class BrondDataService {
	// Load GeoJSON data as a resource
	private readonly broendeResource = httpResource<FeatureCollection>(
		() => '/data/broende.geojson'
	);

	// Convert GeoJSON features to Brond view models
	private readonly broende = computed(() => {
		if (!this.broendeResource.hasValue()) {
			return [];
		}
		const features = this.broendeResource.value().features as BrondFeature[];
		return features.map((feature) => this.mapFeatureToBrond(feature));
	});

	// Current filter criteria
	readonly filter = signal<BrondgruppeFilter>({});

	// Expose loading and error states
	readonly isLoading = computed(() => this.broendeResource.isLoading());
	readonly error = computed(() => this.broendeResource.error());
	readonly hasValue = computed(() => this.broendeResource.hasValue());

	// Group brønde by vejnavn and compute statistics
	readonly brondgrupper = computed(() => {
		const broende = this.broende();
		const filter = this.filter();

		// Group by vejnavn
		const gruppeMap = new Map<string, Brond[]>();
		for (const brond of broende) {
			const existing = gruppeMap.get(brond.vejNavn) || [];
			existing.push(brond);
			gruppeMap.set(brond.vejNavn, existing);
		}

		// Convert to Brondgruppe array with statistics
		let grupper: Brondgruppe[] = Array.from(gruppeMap.entries()).map(
			([vejNavn, broende]) => {
				const statistik = this.calculateStatistik(broende);
				const centerPoint = this.calculateCenterPoint(broende);

				return {
					vejNavn,
					vejKode: broende[0].vejKode,
					broende,
					statistik,
					centerPoint,
				};
			}
		);

		// Apply filters
		if (filter.vejNavnSearch) {
			const search = filter.vejNavnSearch.toLowerCase();
			grupper = grupper.filter((g) =>
				g.vejNavn.toLowerCase().includes(search)
			);
		}

		if (filter.minAntalBroende) {
			grupper = grupper.filter(
				(g) => g.statistik.antalBroende >= filter.minAntalBroende!
			);
		}

		if (filter.statusFilter && filter.statusFilter.length > 0) {
			grupper = grupper.filter((g) =>
				g.broende.some((b) => filter.statusFilter!.includes(b.objektStatus))
			);
		}

		// Sort by vejnavn
		grupper.sort((a, b) => a.vejNavn.localeCompare(b.vejNavn, 'da'));

		return grupper;
	});

	// Total count of brøndgrupper
	readonly antalGrupper = computed(() => this.brondgrupper().length);

	// Total count of brønde across all groups
	readonly antalBroende = computed(() =>
		this.brondgrupper().reduce((sum, g) => sum + g.statistik.antalBroende, 0)
	);

	// GeoJSON polygons for brøndgrupper using concave hull
	readonly brondgrupperGeoJSON = computed<FeatureCollection<Polygon>>(() => {
		// Group brønde by cluster_id for hull computation
		const broende = this.broende();
		const grupperByCluster = new Map<number, Brond[]>();
		for (const b of broende) {
			const key = b.clusterId ?? -1;
			const arr = grupperByCluster.get(key) || [];
			arr.push(b);
			grupperByCluster.set(key, arr);
		}

		const features: Feature<Polygon>[] = [];
		for (const [clusterId, gruppe] of grupperByCluster.entries()) {
			// Require at least 3 points for a polygon
			if (gruppe.length < 3) continue;
			const pts: Feature<Point>[] = gruppe.map((b) => turfPoint([b.longitude, b.latitude]));
			const fc = turfFeatureCollection(pts);
			// Adaptive maxEdge: scale with group spread, clamped to [0.08km, 0.2km]
			const bb = turfBbox(fc);
			const [minX, minY, maxX, maxY] = bb;
			// Rough spread as diagonal distance in degrees; map to km factor
			const spreadDeg = Math.hypot(maxX - minX, maxY - minY);
			let maxEdgeKm = 0.12; // default ~120m
			if (spreadDeg > 0) {
				maxEdgeKm = Math.min(0.2, Math.max(0.08, spreadDeg * 8));
			}
			let poly = concave(fc, { maxEdge: maxEdgeKm, units: 'kilometers' }) || convex(fc);
			if (!poly) continue;

			// Ensure geometry is Polygon (convert MultiPolygon by taking first polygon)
			let polygonGeom: Polygon;
			if (poly.geometry.type === 'Polygon') {
				polygonGeom = poly.geometry as Polygon;
			} else {
				const mp = poly.geometry as any;
				const first = mp.coordinates[0];
				polygonGeom = { type: 'Polygon', coordinates: first } as Polygon;
			}

			features.push({
				type: 'Feature',
				geometry: polygonGeom,
				properties: {
					id: clusterId,
					antal_broende: gruppe.length,
					color_index: (clusterId ?? 0) % 12,
				},
			});
		}

		return { type: 'FeatureCollection', features };
	});

	/**
	 * Update the filter criteria
	 */
	updateFilter(filter: Partial<BrondgruppeFilter>): void {
		this.filter.update((current) => ({ ...current, ...filter }));
	}

	/**
	 * Clear all filters
	 */
	clearFilters(): void {
		this.filter.set({});
	}

	/**
	 * Map a GeoJSON feature to a Brond view model
	 */
	private mapFeatureToBrond(feature: BrondFeature): Brond {
		const props = feature.properties;
		const [longitude, latitude] = feature.geometry.coordinates;

		return {
			id: props.id,
			vejNavn: props.vej_navn,
			vejKode: props.vej_kode,
			latitude,
			longitude,
			objektStatus: props.objekt_status,
			broendtype: props.broendtype,
			pPladsDistance: props.p_plads_distance_m,
			clusterId: props.cluster_id,
			registreringDato: new Date(props.registreringfra_dato),
		};
	}

	/**
	 * Calculate statistics for a group of brønde
	 */
	private calculateStatistik(broende: Brond[]): BrondgruppeStatistik {
		const antalBroende = broende.length;

		// Count P-pladser (wells within 10m of parking)
		const antalPPladser = broende.filter((b) => b.pPladsDistance <= 10).length;

		// For prototype: mock some completion data
		// In production, this would come from task/completion data
		const antalUdfoerte = Math.floor(antalBroende * 0.6); // 60% completed
		const antalDefekte = Math.floor(antalBroende * 0.05); // 5% defective

		const procentUdfoert =
			antalBroende > 0 ? Math.round((antalUdfoerte / antalBroende) * 100) : 0;

		return {
			antalBroende,
			antalPPladser,
			antalUdfoerte,
			antalDefekte,
			procentUdfoert,
		};
	}

	/**
	 * Calculate the center point (average coordinates) for a group of brønde
	 */
	private calculateCenterPoint(broende: Brond[]): {
		latitude: number;
		longitude: number;
	} {
		if (broende.length === 0) {
			return { latitude: 0, longitude: 0 };
		}

		const sumLat = broende.reduce((sum, b) => sum + b.latitude, 0);
		const sumLng = broende.reduce((sum, b) => sum + b.longitude, 0);

		return {
			latitude: sumLat / broende.length,
			longitude: sumLng / broende.length,
		};
	}
}
