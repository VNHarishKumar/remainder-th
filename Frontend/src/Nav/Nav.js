import './Nav.css';
import { Link } from 'react-router-dom';

const Nav = () => {

    return (
        <div>
            <div className = "button">
                <Link to="/Postremainder"><button className="btn1">Add Remainder</button></Link> <Link to="/Getremainder"><button className="btn2">View Remainder</button></Link>
            </div>
  </div>  
);

}

export default Nav;
