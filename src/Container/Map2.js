import React, { useState, useEffect, useDebugValue } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { csv } from "d3-fetch";

import { readRemoteFile } from 'react-papaparse';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

const colorScale = scaleQuantize()
    .domain([1, 10])
    .range([
        "#ffedea",
        "#ffcec5",
        "#ffad9f",
        "#ff8a75",
        "#ff5533",
        "#e2492d",
        "#be3d26",
        "#9a311f",
        "#782618"
    ]);

const MapChart = () => {
    const [countyData, setCountyData] = useState([])
    const [finalCountyData, setFinalCountyData] = useState([])
    const [maskData, setMaskData] = useState([])
    const [populationData, setPopulationData] = useState([])
    const [rawStatesData, setRawStatesData] = useState([])

    const states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']

    const colorPicker = (deathCount, pop) => {
        let deathPercent = deathCount / pop
        if (deathPercent > .002) {
            return "#782618"
        } else if (deathPercent > .001) {
            return "#be3d26"
        }
        // else if (deathPercent > .0005) {
        //     return "#ff5533"
        // } else if (deathPercent > .0001) {
        //     return "#ffad9f"
        // } else if (deathPercent > 0) {
        //     return "#ffedea"
        // } 
        else {
            return "#FFFFDD"
        }
    }

    const recentColorPicker = (recentCases, population) => {
        let percent = recentCases / population
        if (percent > .05) {
            return "#782618"
        } else if (percent > .03) {
            return "#be3d26"
        } else if (percent > .01) {
            return "#ff5533"
        } else if (percent > .005) {
            return "#ffad9f"
        } else if (percent > 0) {
            return "#ffedea"
        } else {
            return "#FFFFDD"
        }
    }

    const colorPickerMasks = (percentDo) => {
        if (percentDo > .8) {
            return "#782618"
        }
        // else if (percentDo > .8) {
        //     return "#be3d26"
        // } else if (percentDo > .65) {
        //     return "#ff5533"
        // } else if (percentDo > .5) {
        //     return "#ffad9f"
        // } else if (percentDo > 0) {
        //     return "#ffedea"
        // } 
        else {
            return "#EEE"
        }
    }

    //matches the data from nyt and census to find overall population in counties
    const findPopulation = (fips) => {
        let val = populationData.find(s => s.fips == fips)
        if (val) {
            return val.pop
        }
        //if no matiching fips could be found (typically very small counties with no data)
        return 0
    }

    const findMaskFrequency = (fips) => {
        let val = maskData.find(s => s.fips == fips)
        if (val) {
            return val.usually
        }
    }

    //takes covid data from nyt and puts it in easier to read array of objects
    const parseCountyData = (results) => {
        //for some reason it kept looping
        if (countyData.length == 0) {
            let newResults = results.data.map(row => {
                let popTemp = findPopulation(row[3])
                let usuallyMaskTemp = findMaskFrequency(row[3])
                return {
                    date: row[0],
                    county: row[1],
                    state: row[2],
                    fips: row[3],
                    cases: row[4],
                    deaths: row[5],
                    confirmed_cases: row[6],
                    confirmed_deaths: row[7],
                    probable_cases: row[8],
                    probable_deaths: row[9],
                    pop: popTemp,
                    color: colorPicker(row[5], popTemp),
                    usuallyWearMask: usuallyMaskTemp,
                }
            })
            setCountyData(newResults)
        }

    }

    const parseCountyData2 = (results) => {
        console.log('parse2')
        let newResults = results.map(state => {
            return state.map(row => {
                let fipsVal = countyData.find(s => {
                    let tempCounty = s.county.toLowerCase()
                    let tempState = s.state.toLowerCase()
                    return ((tempCounty === row.county) && (tempState === row.province))
                })
                if (fipsVal) {
                    fipsVal = fipsVal.fips
                } else {
                    fipsVal = 0
                }
                let popTemp = findPopulation(fipsVal)
                let usuallyMaskTemp = findMaskFrequency(fipsVal)
                return {
                    county: row.county,
                    state: row.province,
                    fips: fipsVal,
                    casesLast30: Object.values(row.timeline.cases)[29] - Object.values(row.timeline.cases)[0],
                    // deaths: row[5],
                    // confirmed_cases: row[6],
                    // confirmed_deaths: row[7],
                    // probable_cases: row[8],
                    // probable_deaths: row[9],
                    pop: popTemp,
                    color: recentColorPicker((Object.values(row.timeline.cases)[29] - Object.values(row.timeline.cases)[0]), popTemp),
                    usuallyWearMask: usuallyMaskTemp,
                }
            })
        })
        console.log(newResults)
        setFinalCountyData(newResults)
    }

    //takes population data from census and puts it in easier to read array of objects
    const parsePopulationData = (results) => {
        let newResults = results.map(row => {
            return {
                fips: row[2] + row[3],
                pop: row[0]
            }
        })
        setPopulationData(newResults)
    }

    const parseMaskData = (results) => {
        let newResults = results.data.map(row => {
            let tempUsually = parseFloat(row[5]) + parseFloat(row[4])
            let tempUsuallyNot = parseFloat(row[1]) + parseFloat(row[2]) + parseFloat(row[3])
            return {
                fips: row[0],
                usually: tempUsually,
                usuallyNot: tempUsuallyNot,
                color: colorPickerMasks(tempUsually)
            }
        })
        setMaskData(newResults)
    }

    useEffect(() => {
        let totalPopUsually = 0;
        let totalPopNotUsually = 0;
        let totalCasesUsaully = 0;
        let totalCasesNotUsually = 0;

        var merged = [].concat.apply([], finalCountyData);

        merged.forEach(county => {
            console.log(county)
            if (county.usuallyWearMask > .8 && county.pop > 0 && county.casesLast30) {
                totalPopUsually += parseInt(county.pop)
                totalCasesUsaully += parseInt(county.casesLast30)
            } else if (county.pop > 0 && county.casesLast30) {
                totalPopNotUsually += parseInt(county.pop)
                totalCasesNotUsually += parseInt(county.casesLast30)
            }
        })
        console.log('usually wears:')
        console.log(totalCasesUsaully + '  ' + totalPopUsually + '  ' + totalCasesUsaully / totalPopUsually);
        console.log('does not usually wear:')
        console.log(totalCasesNotUsually + '  ' + totalPopNotUsually + '  ' + totalCasesNotUsually / totalPopNotUsually)
    }, [finalCountyData])

    useEffect(() => {
        console.log(rawStatesData.length)
        if (rawStatesData.length == 50) {
            parseCountyData2(rawStatesData)
        }
    }, [rawStatesData])

    useEffect(() => {
        //Getting covid county data from nyt once population data is finished
        if (countyData.length > 3244) {
            console.log('county length')
            if (finalCountyData.length < 1) {

                const promises = states.map(state => fetch(`https://corona.lmao.ninja/v2/historical/usacounties/${state.toLowerCase()}?lastdays=30`));
                console.log(promises)
                let progress = 0
                promises.forEach(p => p.then((response) => {
                    (response.json().then(function (data) {
                        setRawStatesData(rawStatesData => [...rawStatesData, data])
                    }))
                    progress++
                }));
            }
        }
    }, [countyData.length])



    useEffect(() => {
        //when populationData is populated, find covid data from nyt
        if (populationData.length === 3221) {
            readRemoteFile('https://raw.githubusercontent.com/nytimes/covid-19-data/master/live/us-counties.csv', {
                complete: (results) => {
                    console.log(results)
                    parseCountyData(results)
                },
            });
        }
    }, [populationData.length])

    //find population data on page load
    useEffect(() => {
        fetch("https://api.census.gov/data/2019/pep/population?get=POP&DATE_CODE=12&for=county:*")
            .then(res => res.json())
            .then(
                (result) => {
                    parsePopulationData(result)
                },
                (error) => {
                    console.log(error)
                }
            )

        readRemoteFile('https://raw.githubusercontent.com/nytimes/covid-19-data/master/mask-use/mask-use-by-county.csv', {
            complete: (results) => {
                parseMaskData(results)
            },
        });
    }, []);

    return (
        <div>
            deaths per capita
            <ComposableMap projection="geoAlbersUsa" width={2600}>
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map(geo => {
                            if (finalCountyData.length == 50) {
                                var merged = [].concat.apply([], finalCountyData);
                                const cur = merged.find(s => s.fips === geo.id);
                                // console.log(merged)
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={cur ? cur.color : '#EEE'}
                                    />
                                );
                            }

                        })
                    }
                </Geographies>
            </ComposableMap>
            mask wearing
            <ComposableMap projection="geoAlbersUsa" width={2600}>
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map(geo => {
                            const cur = maskData.find(s => s.fips == geo.id);
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
