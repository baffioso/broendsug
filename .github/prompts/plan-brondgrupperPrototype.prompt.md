# Plan: Prototype for brøndgrupper filtering with split-view map

Build a prototype Angular application with a split-view interface showing a list of brøndgrupper (well groups based on street names) on the left and a MapLibre map displaying these groups on the right. The focus is on "Find og filtrer brøndgrupper" functionality.

## Steps

1. **Initialize Angular project** with latest version, install MapLibre GL JS, and set up basic project structure with routing and core module
2. **Define TypeScript models** for `Brond` (well), `Brondgruppe` (well group), and supporting types including vejnavn (street name), coordinates, P-pladser (parking), and status properties in [src/app/models/](path). I have provided sample data in [data/broende.geojson](path). Maybe you need to move it to assets/public folder.
4. **Build split-view layout component** in [src/app/components/main-view/](path) with responsive grid layout (40/60 split) containing list panel and map panel containers
5. **Implement brøndgrupper list component** in [src/app/components/brondgruppe-list/](path) displaying grouped wells with statistics (antal brønde, p-pladser, udførte/defekte status) and basic filtering
6. **Integrate MapLibre map component** in [src/app/components/map-view/](path) to display brøndgrupper as clustered markers with color-coding based on completion status and hover/click interactions

## Further Considerations

1. **Data source approach?** Mock JSON file in assets folder vs. TypeScript constants in service vs. future API endpoint structure - Recommend assets/mock-data.json for easy editing during prototype
2. **Map styling preference?** OpenStreetMap base layer vs. Danish-specific basemap (e.g., Datafordeleren) - Recommend starting with OSM for simplicity
3. **Filter complexity for prototype?** Basic text search + status checkboxes vs. full multi-criteria filtering panel - Recommend minimal filters for MVP: vejnavn search and status toggles
