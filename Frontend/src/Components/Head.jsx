import React from "react";
import { Link } from "react-router-dom";

const Head = ({
  title = "Designs",
  subtitle = "Explore our exclusive collection",
  image = "/Image/HeadBg.jpg",
}) => {
  return (
    <section
      className="w-full sm:h-[40vh] h-[35vh] bg-cover bg-center py-16 px-4 md:px-10 text-white shadow-4xl"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="md:pl-30 max-w-7xl mx-auto flex flex-col items-center md:items-start text-center md:text-left gap-4">
        <h1 className="text-3xl text-left text-primary md:text-5xl font-bold drop-shadow-md">{title}</h1>
        <div className="text-primary font-medium text-sm md:text-base flex flex-wrap justify-start items-center gap-2 drop-shadow-md">
          <Link to="/" className="hover:underline text-primary/90">Home</Link>
          <span>{">"}</span>
          <span className="text-primary/90">{subtitle}</span>
        </div>
      </div>
    </section>
  );
};

export default Head;
