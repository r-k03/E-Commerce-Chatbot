import { FaSearch, FaShoppingCart, FaUser, FaHeart } from 'react-icons/fa'

const EcommerceStore = () => {
  return (
    <>
      {/* Website header section */}
      <header className="header">
        <div className="container">
          <div className="top-bar">
            <div className="logo">ShopSmart</div>
            <div className="search-bar">
              <input type="text" placeholder="Search for products..." />
              <button>
                <FaSearch />
              </button>
            </div>

            <div className="nav-icons">
              <a href="#account">
                {/* User icon with size 20px */}
                <FaUser size={20} />
              </a>
              <a href="#wishlist">
                {/* Heart icon for favorites with size 20px */}
                <FaHeart size={20} />
                <span className="badge">{3}</span>
              </a>
              <a href="#cart">
                {/* Shopping cart icon with size 20px */}
                <FaShoppingCart size={20} />
                <span className="badge">{2}</span>
              </a>
            </div>
          </div>

          {/* Navigation menu bar */}
          <nav className="nav-bar">
            {/* Unordered list for navigation items */}
            <ul>
              <li>
                <a href="#" className="active">
                  Home
                </a>
              </li>
              <li>
                <a href="#">Electronics</a>
              </li>
              <li>
                <a href="#">Clothing</a>
              </li>
              <li>
                <a href="#">Home & Kitchen</a>
              </li>
              <li>
                <a href="#">Beauty</a>
              </li>
              <li>
                <a href="#">Sports</a>
              </li>
              <li>
                <a href="#">Deals</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
};

export default EcommerceStore;
