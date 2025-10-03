import React from 'react';
import { MapPin, Phone, Mail, Globe, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/footer-bg2.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-8 lg:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16">
            
            {/* College Info Section */}
            <div className="space-y-4 lg:space-y-6 text-center md:text-left">
              <div>
                {/* Letterhead Style Logo - Matching Navbar */}
                <div className="inline-block mb-4 lg:mb-6 group transition-all duration-500">
                  <div className="flex items-center gap-3 lg:gap-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 lg:px-4 py-2 lg:py-3 shadow-lg border border-white/20 group-hover:shadow-xl group-hover:bg-white transition-all duration-500">
                    {/* Logo */}
                    <div className="relative">
                      <img 
                        src="/logo.png" 
                        alt="College Logo" 
                        className="h-10 lg:h-12 w-auto drop-shadow-sm transition-all duration-500" 
                      />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4"> Vidya Bharati International School</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm lg:text-base">
                Empowering minds through technology. Access the world's largest collection of academic resources, research papers, and digital archives. Join millions of researchers, students, and educators in the pursuit of knowledge.
              </p>
            </div>

            {/* Quick Links Section */}
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h4 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 relative text-center md:text-left">
                  Quick Links
                  <div className="absolute left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 mt-1 w-20 lg:w-28 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                </h4>
              </div>
              <ul className="space-y-3 lg:space-y-4">
                {[
                  { name: "About Us", url: "https://www.vbistinsukia.com/about_us" },
                  { name: "Principal's Message", url: "https://www.vbistinsukia.com/principal_message" },
                  { name: "Contact Us ", url: "https://www.vbistinsukia.com/contact_us" },
                  { name: "CBSE Website", url: "https://cbseacademic.nic.in/index.html" },
                  // { name: "Anti Ragging Affidavit", url: "#" },
                  // { name: "National Council For Teacher Education", url: "http://www.ncte-india.org/" },
                  // { name: "Old Website", url: "#" }
                ].map((link, index) => (
                  <li key={index} className="group">
                    <a 
                      href={link.url}
                      className="flex items-center justify-center md:justify-start text-gray-300 hover:text-white transition-all duration-300 group-hover:translate-x-2"
                      target={link.url !== "#" ? "_blank" : "_self"}
                      rel={link.url !== "#" ? "noopener noreferrer" : ""}
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors duration-300"></div>
                      <span className="text-sm lg:text-base">{link.name}</span>
                      {link.url !== "#" && <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Us Section */}
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h4 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 relative text-center md:text-left">
                  Contact Us
                  <div className="absolute left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 mt-1 w-20 lg:w-28 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                </h4>
              </div>
              <ul className="space-y-4 lg:space-y-6">
                <li className="flex flex-col sm:flex-row items-start group">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-red-500/20 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 lg:mr-4 group-hover:bg-red-500/30 transition-colors duration-300 mx-auto sm:mx-0">
                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-gray-300 text-sm lg:text-base leading-relaxed">
                       Vidya Bharati International School, Tinsukia, Assam
                    </p>
                  </div>
                </li>
                
                <li className="flex flex-col sm:flex-row items-center group">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 lg:mr-4 group-hover:bg-green-500/30 transition-colors duration-300">
                    <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                  </div>
                  <div className="text-gray-300 text-sm lg:text-base text-center sm:text-left">
                    <a href="tel:03754254503" className="hover:text-white transition-colors duration-300 block">
                      98099525547
                    </a>
                    <a href="tel:+919101647525" className="hover:text-white transition-colors duration-300 block">
                       8471988851
                    </a>
                  </div>
                </li>
                
                <li className="flex flex-col sm:flex-row items-center group">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 lg:mr-4 group-hover:bg-blue-500/30 transition-colors duration-300">
                    <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                  </div>
                  <a href="mailto:vbistsk@gmail.com" className="text-gray-300 hover:text-white transition-colors duration-300 text-sm lg:text-base break-all text-center sm:text-left">
                    vbistsk@gmail.com
                  </a>
                </li>
                
                <li className="flex flex-col sm:flex-row items-center group">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 lg:mr-4 group-hover:bg-purple-500/30 transition-colors duration-300">
                    <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                  </div>
                  <a href="https://www.vbistinsukia.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors duration-300 text-sm lg:text-base text-center sm:text-left">
                    https://www.vbistinsukia.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-3 lg:py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 lg:gap-4 text-center md:text-left">
              <div>
                <p className="text-gray-300 text-xs lg:text-sm">
                  © 2025 All Rights Reserved -  Vidya Bharati International School, Tinsukia 
                </p>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <span className="text-gray-400 text-xs lg:text-sm">Developed by</span>
                <div className="flex items-center gap-2 lg:gap-3">
                  <a 
                    href="https://libkart.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 transition-all duration-300 hover:scale-105"
                  >
                    <img src="/lib.png" alt="Libkart Logo" className="h-5 lg:h-6 w-auto" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;