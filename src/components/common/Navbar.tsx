import React from 'react';

const Navbar = () => {
    return (
        <nav className="bg-primary py-2 shadow-md items-center justify-center fixed top-0 left-0 w-full z-50">
            <div className="max-w-5xl ml-10 flex items-center justify-start px-5">
                <img
                    src="/logo_el_bosque.png"
                    alt="Logo"
                    className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <h1 className="text-white m-0 text-2xl font-mono tracking-wide">Georreferenciación DOM</h1>
            
            </div>
        </nav>
    );
};


export default Navbar;