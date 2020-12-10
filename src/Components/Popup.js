import './Popup.css';

const Popup = (props) => {
    const {
        state
    } = props

    console.log('hret')
    return (
        <div className="Main">
            {state}
        </div>
    )
}

export default Popup;
