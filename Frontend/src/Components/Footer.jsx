import React from "react";
import { Link } from "react-router-dom";
import logo from "/Image/logo.png";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#283b53] text-white px-6 py-10 md:px-12 lg:px-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
        {/* About Section */}
        <div className="h-full flex flex-col justify-between">
          <div>
            <img src={logo} alt="Logo" className="h-16 w-16 mb-4" />
            <p className="text-md text-gray-300 text-justify">
              At TeeTrendz, we bring your fashion ideas to life. Discover unique
              and stylish t-shirts designed to express your personality. Quality
              and creativity in every thread.
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            <a href="https://www.facebook.com/profile.php?id=61565711381285" className="text-gray-300 hover:text-white">
              <FaFacebookF />
            </a>
            <a href="https://www.instagram.com/?__pwa=1" className="text-gray-300 hover:text-white">
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/916385381388" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <FaWhatsapp size={20} />
              {/* <span>+91 6385381388</span> */}
            </a>

          </div>
        </div>

        {/* Quick Links */}
        <div className="h-full flex flex-col justify-between ml-0 md:ml-17 space-y-6">
          <div>
            <h3 className="text-lg uppercase font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="list-disc list-inside space-y-1 text-md text-gray-300">
              <li>
                <Link to="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:underline">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/designs" className="hover:underline">
                  Design
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:underline">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:underline">
                  Services
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Details */}
        <div className="flex flex-col justify-between">
          <h3 className="text-lg uppercase font-semibold mb-6">Contact</h3>
          <ul className="text-gray-300 text-md space-y-3">
            <li className="flex items-center gap-2">
              <FaPhoneAlt /> <span>+91 6385381388</span>
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope /> <span>mauvalprint@gmail.com</span>
            </li>
            <li className="flex items-start gap-2">
              <FaMapMarkerAlt className="mt-1" />
              <span>
                No.347,Saibaba colony,
                <br />
                Asiriyar Nagar, Tirupattur - 635601
              </span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="h-full flex flex-col justify-between">
          <h3 className="text-lg uppercase font-semibold mb-4">Newsletter</h3>
          <p className="text-md text-gray-300 mb-4">
            Subscribe to get the latest updates and offers.
          </p>
          <form className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="rounded-md px-4 py-2 placeholder-gray-500 text-white border border-gray-500 bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-600"
            />
            <button
              type="submit"
              className="bg-white/80 hover:bg-white cursor-pointer text-primary px-4 py-2 rounded-md"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-gray-400 text-sm mt-10">
        &copy; {new Date().getFullYear()} MauvalPrint. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
