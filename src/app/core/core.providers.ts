import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const CORE_PROVIDERS: Array<Provider | EnvironmentProviders> = [
	provideHttpClient(withFetch())
];
