import { Brond } from './brond.model';

/**
 * Statistics for a brøndgruppe
 */
export interface BrondgruppeStatistik {
	antalBroende: number;
	antalPPladser: number;
	antalUdfoerte: number;
	antalDefekte: number;
	procentUdfoert: number;
}

/**
 * A group of brønde organized by street name (vejnavn)
 */
export interface Brondgruppe {
	vejNavn: string;
	vejKode: string;
	broende: Brond[];
	statistik: BrondgruppeStatistik;
	/** Center point for the group (average of all well coordinates) */
	centerPoint: {
		latitude: number;
		longitude: number;
	};
}

/**
 * Filter criteria for brøndgrupper
 */
export interface BrondgruppeFilter {
	vejNavnSearch?: string;
	minAntalBroende?: number;
	statusFilter?: string[];
	dateRange?: {
		start: Date | null;
		end: Date | null;
	};
}
