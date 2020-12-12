import './Popup.css';

const Popup = (props) => {
    const {
        state
    } = props

    return (
        <div className="Main">
            {state}
        </div>
    )
}

export default Popup;
