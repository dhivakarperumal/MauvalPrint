// import React, { useEffect, useState } from "react";
// import Slider from "react-slick";
// import { db } from "../firebase";
// import { collection, getDocs } from "firebase/firestore";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
// import { Link } from "react-router-dom";

// const Category = () => {
//   const [categories, setCategories] = useState([]);

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, "categories"));
//         const data = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setCategories(data);
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//       }
//     };

//     fetchCategories();
//   }, []);

//   const sliderSettings = {
//     dots: false,
//     infinite: true,
//     speed: 500,
//     autoplay: true,
//     autoplaySpeed: 2000,
//     pauseOnHover: false,
//     slidesToShow: 6,
//     slidesToScroll: 1,
//     responsive: [
//       { breakpoint: 1280, settings: { slidesToShow: 4 } },
//       { breakpoint: 1024, settings: { slidesToShow: 3 } },
//       { breakpoint: 768, settings: { slidesToShow: 2 } },
//       { breakpoint: 480, settings: { slidesToShow: 1 } },
//     ],
//   };

//   return (
//     <div className="bg-white px-6 py-10 overflow-x-hidden">
//       <h2 className="text-3xl font-bold text-center mb-8">Categories</h2>

//       <Slider {...sliderSettings}>
//         {categories.map((cat, index) => (
//           <div key={cat.id || index} className="px-3">
//             <Link to={"/products"} className="group flex flex-col items-center text-center py-20">
//               <div className="w-37 h-37 bg-primary/10 rounded-full shadow-md flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
//                 <div className="relative -top-7 z-20 transition-transform duration-700 group-hover:-translate-y-4">
//                   {/* Render first image from array */}
//                   <img
//                     src={Array.isArray(cat.cimgs) ? cat.cimgs[0] : cat.cimgs}
//                     alt={cat.cname}
//                     className="w-38 h-42 object-cover relative z-10"
//                   />
//                   <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-20 h-3 bg-black/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
//                 </div>
//               </div>
//               <p className="mt-6 text-sm font-semibold text-gray-800 uppercase tracking-wide">
//                 {cat.cname}
//               </p>
//             </Link>
//           </div>
//         ))}
//       </Slider>
//     </div>
//   );
// };

// export default Category;


import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

const Category = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="bg-white px-6 py-10">
      <h2 className="text-3xl font-bold text-center mb-8">Categories</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((cat, index) => (
          <div key={cat.id || index} className="px-3">
            <Link to={`/products/${encodeURIComponent(cat.cname)}?subcategory=all`} className="group flex flex-col items-center text-center py-20">
              <div className="w-37 h-37 bg-primary/10 rounded-full shadow-md flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                <div className="relative -top-7 z-20 transition-transform duration-700 group-hover:-translate-y-4">
                  {/* Render first image from array */}
                  <img
                    src={Array.isArray(cat.cimgs) ? cat.cimgs[0] : cat.cimgs}
                    alt={cat.cname}
                    className="w-38 h-42 object-cover relative z-10"
                  />
                  <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-20 h-3 bg-black/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
                </div>
              </div>
              <p className="mt-6 text-sm font-semibold text-gray-800 uppercase tracking-wide">
                {cat.cname}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Category;
