import { Feature, Point } from 'geojson';

/**
 * Properties of a brønd (well) from the GeoJSON data
 */
export interface BrondProperties {
	id: number;
	fot_id: number;
	objekt_status: string;
	geometri_status: string;
	registreringfra: string;
	registreringfra_dato: string;
	applikation: string;
	registreringsaktoer: string;
	forretningshaendelse: string;
	broendtype: string | null;
	vej_kode: string;
	vej_navn: string;
	vej_distance_m: number;
	p_plads_distance_m: number;
	cluster_id: number;
}

/**
 * A brønd feature as represented in GeoJSON
 */
export type BrondFeature = Feature<Point, BrondProperties>;

/**
 * View model for displaying a brønd in the UI
 */
export interface Brond {
	id: number;
	vejNavn: string;
	vejKode: string;
	latitude: number;
	longitude: number;
	objektStatus: string;
	broendtype: string | null;
	pPladsDistance: number;
	clusterId: number;
	registreringDato: Date;
}
