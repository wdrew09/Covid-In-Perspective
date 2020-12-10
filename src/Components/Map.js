import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

const MapChart = (props) => {
    const {
        data,
    } = props

    return (
        <div>
            deaths per capita
            <ComposableMap projection="geoAlbersUsa" width={2600}>
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map(geo => {
                                const cur = data.find(s => s.fips === geo.id);
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={cur ? cur.color : '#EEE'}
                                    />
                                );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
};

export default MapChart;
