import React, { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import './Map.css'

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

const MapChart = (props) => {
    const {
        data,
        maskData,
        gradientColorRight,
        gradientColorLeft,
        gradientColorMiddle,
        keyTitle
    } = props

    const [clicked, setClicked] = useState(false)
    const [clickedData, setClickedData] = useState()

    const wasClicked = (data) => {
        console.log(data)
        setClicked(true)
        setClickedData(data)
    }

    console.log(data)
    const capitalizeFirstLetter = (string) => {
        if (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }

    return (
        <div className="Main">
            <ComposableMap projection="geoAlbersUsa" className="Map">
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map(geo => {
                            const cur = data.find(s => s.fips === geo.id);
                            const noData = { state: "No Data" }
                            return (
                                <Geography
                                    onClick={() => cur ? wasClicked(cur) : wasClicked(noData)}
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={cur ? (maskData ? cur.maskColor : cur.color) : '#EEE'}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
            <div className="Gradient">
                <div className="GradientKey">
                    <span>Low {keyTitle}</span>
                    <span>High {keyTitle}</span>
                </div>
                <div className="GradientBar" style={{ background: `linear-gradient(to right, ${gradientColorLeft}, 35%, ${gradientColorRight}) ` }}>
                </div>
            </div>
            <div className="BottomBar">
                {clicked ?
                    <div>
                        <span>
                            <span>{capitalizeFirstLetter(clickedData.county)} County - </span>
                            <span>{capitalizeFirstLetter(clickedData.state)}</span>
                        </span>
                        <span className="CountyData">
                            <div>
                                <span>Usually Wear Mask</span>
                                <span style={{ fontSize: "1.75vw" }}>{(clickedData.usuallyWearMask * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                                <span>Deaths</span>
                                <span style={{ fontSize: "1.75vw" }}>{clickedData.deaths*1}</span>
                            </div>
                            <div>
                                <span>Infected Pop. - Last 30 Days</span>
                                <span style={{ fontSize: "1.75vw" }}>{((clickedData.casesLast30 / clickedData.pop) * 100).toFixed(1)}%</span>
                            </div>
                        </span>
                    </div>
                    :
                    <span>Select a county to see data...</span>
                }
            </div>
        </div>
    );
};

export default MapChart;
