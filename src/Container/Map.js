import React, { useEffect, useState } from 'react';

import styles from './Map.css';

import USAMap from "react-usa-map";

import Popup from '../Components/Popup';

const Map = () => {

    const [showPopup, setShowPopup] = useState(false)
    const [selectedState, setSelectedState] = useState()

    const mapHandler = (event) => {
        alert(event.target.dataset.name);
    };

    const statesFilling = () => {
        return {
            "NJ": {
                fill: "navy",
                clickHandler: () => popupValues('NJ')
            },
            "NY": {
                fill: "#CC0000"
            }
        };
    };

    const popupValues = (state) => {
        setShowPopup(true)
        setSelectedState(state)
    }

    return (
        <div className={styles.Main}>
            <USAMap customize={statesFilling()} onClick={mapHandler} />

            {showPopup &&
                <Popup state={selectedState} />
            }
        </div>
    );
}

export default Map;
