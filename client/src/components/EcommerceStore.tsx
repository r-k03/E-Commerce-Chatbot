import { FaSearch, FaShoppingCart, FaUser, FaHeart } from "react-icons/fa";
import ChatBotWidget from "./ChatBotWidget";

const EcommerceStore = () => {
  return (
    <>
      {/* Website header section */}
      <header className="header">
        <div className="container">
          <div className="top-bar">
            <div className="logo">NeonMarket</div>
            <div className="search-bar">
              <input type="text" placeholder="Search for products..." />
              <button>
                <FaSearch />
              </button>
            </div>

            <div className="nav-icons">
              <a href="#account">
                {/* User icon */}
                <FaUser size={20} />
              </a>
              <a href="#wishlist">
                {/* Heart icon for favorites */}
                <FaHeart size={20} />
                <span className="badge">{3}</span>
              </a>
              <a href="#cart">
                {/* Shopping cart icon */}
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

      <main>
        <div className="hero">
          <div className="container">
            <h1>Summer Sale is Live!</h1>
            <p>Get up to 50% off on selected items. Limited time offer.</p>
            <button>Shop Now</button>
          </div>
        </div>
      </main>

      {/* Website footer section */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Shop</h3>
              <ul>
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
              </ul>
            </div>

            {/* Second footer column - Customer service links */}
            <div className="footer-column">
              <h3>Customer Service</h3>
              <ul>
                <li>
                  <a href="#">Contact Us</a>
                </li>
                <li>
                  <a href="#">FAQs</a>
                </li>
                <li>
                  <a href="#">Shipping Policy</a>
                </li>
                <li>
                  <a href="#">Returns & Exchanges</a>
                </li>
                <li>
                  <a href="#">Order Tracking</a>
                </li>
              </ul>
            </div>

            {/* Third footer column - Company information */}
            <div className="footer-column">
              <h3>About Us</h3>
              <ul>
                <li>
                  <a href="#">Our Story</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Press</a>
                </li>
                <li>
                  <a href="#">Sustainability</a>
                </li>
              </ul>
            </div>

            {/* Fourth footer column - Social media links */}
            <div className="footer-column">
              <h3>Connect With Us</h3>
              <ul>
                <li>
                  <a href="#">Facebook</a>
                </li>
                <li>
                  <a href="#">Instagram</a>
                </li>
                <li>
                  <a href="#">Twitter</a>
                </li>
                <li>
                  <a href="#">Pinterest</a>
                </li>
                <li>
                  <a href="#">YouTube</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright notice with symbol, dynamic year, and company name */}
          <div className="copyright">
            &copy; {new Date().getFullYear()} NeonMarket. All rights reserved.
          </div>
        </div>
      </footer>

      {/* AI chat widget component */}
      <ChatBotWidget />
    </>
  );
};

export default EcommerceStore;
