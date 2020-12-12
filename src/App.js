import './App.css';

import React, { useState, useEffect, useDebugValue } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { csv } from "d3-fetch";

import { readRemoteFile } from 'react-papaparse';
import { Line, Circle } from 'rc-progress';

import Map from './Components/Map';


function App() {
  const [countyData, setCountyData] = useState([])
  const [finalCountyData, setFinalCountyData] = useState([])
  const [finalCountyProgress, setFinalCountyProgress] = useState(0)
  const [maskData, setMaskData] = useState([])
  const [maskDataProgress, setMaskDataProgress] = useState(0)
  const [populationData, setPopulationData] = useState([])
  const [rawStatesData, setRawStatesData] = useState([])
  const [generalCovidData, setGeneralCovidData] = useState([])

  const [moreLikelyPercent, setMoreLikelyPercent] = useState(0)

  const states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']

  //when final data is finished, calculate some notable results
  useEffect(() => {
    let totalPopUsually = 0;
    let totalPopNotUsually = 0;
    let totalCasesUsaully = 0;
    let totalCasesNotUsually = 0;

    var merged = [].concat.apply([], finalCountyData);

    merged.forEach(county => {
      if (county.usuallyWearMask > .8 && county.pop > 0 && county.casesLast30) {
        totalPopUsually += parseInt(county.pop)
        totalCasesUsaully += parseInt(county.casesLast30)
      } else if (county.pop > 0 && county.casesLast30) {
        totalPopNotUsually += parseInt(county.pop)
        totalCasesNotUsually += parseInt(county.casesLast30)
      }
    })
    setMoreLikelyPercent((((totalCasesNotUsually / totalPopNotUsually) - (totalCasesUsaully / totalPopUsually)) / (totalCasesUsaully / totalPopUsually))*100)
  }, [finalCountyData])

  //When the data from counties is collected, make readable
  useEffect(() => {
    setFinalCountyProgress(rawStatesData.length)
    if (rawStatesData.length == 50) {
      parseCountyData(rawStatesData)
    }
  }, [rawStatesData])


  //When nyt data is populated, get recent county data
  //Note: must do them one by one in order to get data to match fips
  useEffect(() => {
    if (countyData.length > 3244) {
      if (finalCountyData.length < 1) {

        states.map(state =>
          fetch(`https://corona.lmao.ninja/v2/historical/usacounties/${state.toLowerCase()}?lastdays=30`)
            .then(res => res.json())
            .then(
              (result) => {
                setRawStatesData(rawStatesData => [...rawStatesData, result])
              },
              (error) => {
                console.log(error)
              }
            )
        );

      }
    }
  }, [countyData.length])


  //when populationData is populated, find covid data from nyt
  useEffect(() => {
    if (populationData.length === 3221) {
      readRemoteFile('https://raw.githubusercontent.com/nytimes/covid-19-data/master/live/us-counties.csv', {
        complete: (results) => {
          parseNYTData(results)
        },
      });
    }
  }, [populationData.length])

  //find population data and mask data on page load
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

    fetch("https://api.covidtracking.com/v1/us/daily.json")
      .then(res => res.json())
      .then(
        (result) => {
          parseGeneralData(result[0], result[1])
        },
        (error) => {
          console.log(error)
        }
      )
  }, []);

  const curCasesColorScale = scaleQuantize()
    .domain([0, .04])
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

  const masksColorScale = scaleQuantize()
    .domain([.2, 1])
    .range([
      "#DADDDB",
      "#D5D8D5",
      "#C9D4C8",
      "#B1C9AF",
      "#99BE95",
      "#80B679",
      "#73B26B",
      "#66AD5C",
      "#5E9B50"
    ]);

  //matches the data from nyt and census to find overall population in counties
  const findPopulation = (fips) => {
    let val = populationData.find(s => s.fips == fips)
    if (val) {
      return val.pop
    }
    //if no matiching fips could be found (typically very small counties with no data)
    return 0
  }

  //Merging data from mask data into other arrays
  const findMaskFrequency = (fips) => {
    let val = maskData.find(s => s.fips == fips)
    if (val) {
      return val.usually
    }
  }

  const parseGeneralData = (results, resultsYesterday) => {
    let newResults = {
      deaths: results.death,
      deathsIncrease: results.deathIncrease,
      hospitalized: results.hospitalizedCurrently,
      hospitalizedIncrease: results.hospitalizedIncrease,
      icu: results.inIcuCurrently,
      icuIncrease: results.inIcuCurrently - resultsYesterday.inIcuCurrently,
      ventilator: results.onVentilatorCurrently,
      ventilatorIncrease: results.onVentilatorCurrently - resultsYesterday.onVentilatorCurrently,
      positive: results.positive,
      positiveIncrease: results.positiveIncrease,
      recovered: results.recovered,
      recoveredIncrease: results.recovered - resultsYesterday.recovered,

    }
    setGeneralCovidData(newResults)
  }

  //takes covid data from nyt and puts it in easier to read array of objects
  const parseNYTData = (results) => {
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
          usuallyWearMask: usuallyMaskTemp,
        }
      })
      setCountyData(newResults)
    }

  }

  const parseCountyData = (results) => {
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
        console.log(row)
        return {
          county: row.county,
          state: row.province,
          fips: fipsVal,
          casesLast30: Object.values(row.timeline.cases)[29] - Object.values(row.timeline.cases)[0],
          deaths: Object.values(row.timeline.deaths)[29],
          pop: popTemp,
          usuallyWearMask: usuallyMaskTemp,
          color: curCasesColorScale((Object.values(row.timeline.cases)[29] - Object.values(row.timeline.cases)[0]) / popTemp),
          maskColor: masksColorScale(usuallyMaskTemp)
        }
      })
    })
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

  //makes mask data from nyt more readable
  const parseMaskData = (results) => {
    let newResults = results.data.map(row => {
      let tempUsually = parseFloat(row[5]) + parseFloat(row[4])
      let tempUsuallyNot = parseFloat(row[1]) + parseFloat(row[2]) + parseFloat(row[3])
      setMaskDataProgress(maskDataProgress + 0.0318066)
      return {
        fips: row[0],
        usually: tempUsually,
        usuallyNot: tempUsuallyNot,
        color: masksColorScale(tempUsually)
      }

    })
    setMaskData(newResults)
  }

  return (
    <div className="App">
      <div className="Title">Covid In Perspective</div>
      <div className="TopArea">
        <div className="LeftSide">
          <div className="Maps">
            {finalCountyData.length == 50
              ?
              <div style={{ height: 'max-content' }}>
                <span className="MapTitle">Cases In Last 30 Days Per Capita</span>
                <Map data={[].concat.apply([], finalCountyData)} maskData={false} keyTitle={"Case Count"} gradientColorRight={"#782618"} gradientColorLeft={"#ffedea"} />
              </div>
              :
              <div className="Spinner">
                <Circle className="Progress" percent={finalCountyProgress * 2} strokeWidth="8" trailWidth="8" strokeColor="#2db7f5" />
                <span>Retrieving the most up to date information...</span>
              </div>
            }
            {finalCountyData.length == 50
              ?
              <div style={{ height: 'max-content' }}>
                <span className="MapTitle">Mask Usage by County</span>
                <Map data={[].concat.apply([], finalCountyData)} maskData={true} keyTitle={"Mask Usage"} gradientColorRight={"#5E9B50"} gradientColorLeft={"#DADDDB"} />
              </div>
              :
              <div className="Spinner">
                <Circle className="Progress" percent={finalCountyProgress * 2} strokeWidth="8" trailWidth="8" strokeColor="#2db7f5" />
                <span>Retrieving the most up to date information...</span>
              </div>
            }

          </div>
          <div className="BottomData">
            <span>The Bottom Line</span>
            <span>In counties where at least 80% of people frequently or always wear a mask, they were <b>{moreLikelyPercent.toFixed(1)}% Less Likely</b> to contract Coronavirus in the last 30 days. </span>
          </div>
          <div className="BottomData">
            <span>Disclaimer testing</span>
            <span>Data is collected from the NYT and Dynata, corona.lmao.ninja, the Census Bureau, and covidtracking.com. Mask usage data is based on roughly 250,000 interviews done by the NYT and Dynata . "Usually Wear Mask" on this website refers to data where the respondent answered that they frequently or always wear when asked "How often do you wear a mask in public when you expect to be within six feet of another person?"</span>
          </div>
        </div>
        <div className="RigthSideBar">
          <span className="RightSideTitle" style={{ color: '#E63946' }}>Deaths</span>
          <span className="RightSideNumber" style={{ color: '#E63946' }}>{generalCovidData.deaths ? generalCovidData.deaths : <span className="RetrievingData">Retrieving Data...</span>}</span>
          <span className="RightSideIncrease" style={{ color: '#E63946' }}>+{generalCovidData.deathsIncrease} from yesterday</span>
          <span className="RightSideTitle" style={{ color: '#457B9D' }}>Positive Cases</span>
          <span className="RightSideNumber" style={{ color: '#457B9D' }}>{generalCovidData.positive ? generalCovidData.positive : <span className="RetrievingData">Retrieving Data...</span>}</span>
          <span className="RightSideIncrease" style={{ color: '#457B9D' }}>+{generalCovidData.positiveIncrease} from yesterday</span>
          <span className="RightSideTitle" style={{ color: '#E4DB25' }}>Hospitalized</span>
          <span className="RightSideNumber" style={{ color: '#E4DB25' }}>{generalCovidData.hospitalized ? generalCovidData.hospitalized : <span className="RetrievingData">Retrieving Data...</span>}</span>
          <span className="RightSideIncrease" style={{ color: '#E4DB25' }}>+{generalCovidData.hospitalizedIncrease} from yesterday</span>
          <span className="RightSideTitle" style={{ color: '#007F5F' }}>In ICU</span>
          <span className="RightSideNumber" style={{ color: '#007F5F' }}>{generalCovidData.icu ? generalCovidData.icu : <span className="RetrievingData">Retrieving Data...</span>}</span>
          <span className="RightSideIncrease" style={{ color: '#007F5F' }}>+{generalCovidData.icuIncrease} from yesterday</span>
          <span className="RightSideTitle" style={{ color: '#F3722C' }}>On Ventilator</span>
          <span className="RightSideNumber" style={{ color: '#F3722C' }}>{generalCovidData.ventilator ? generalCovidData.ventilator : <span className="RetrievingData">Retrieving Data...</span>}</span>
          <span className="RightSideIncrease" style={{ color: '#F3722C' }}>+{generalCovidData.ventilatorIncrease} from yesterday</span>
          <span className="RightSideTitle" style={{ color: '#4361EE' }}>Recovered</span>
          <span className="RightSideNumber" style={{ color: '#4361EE' }}>{generalCovidData.recovered ? generalCovidData.recovered : <span className="RetrievingData">Retrieving Data...</span>}</span>
          <span className="RightSideIncrease" style={{ color: '#4361EE' }}>+{generalCovidData.recoveredIncrease} from yesterday</span>
        </div>
      </div>

    </div>
  );
}

export default App;
