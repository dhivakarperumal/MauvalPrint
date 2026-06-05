import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import PageContainer from "../Components/PageContainer";

const Category = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        if (response.data?.success) {
          setCategories(response.data.categories || []);
        } else {
          console.error("Error fetching categories: invalid API response", response.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  return (

    <div className="bg-white px-6 py-10">
      <PageContainer>
        <h2 className="text-3xl font-bold text-center mb-8">Categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((cat, index) => {
            const imageSource = cat.images || cat.cimgs;
            const imageUrl = Array.isArray(imageSource) ? imageSource[0] : imageSource;
            const categoryName = cat.name || cat.cname || cat.category_id || "Category";

            return (
              <div key={cat.category_id || cat.id || index} className="px-3">
                <Link to={`/products/${encodeURIComponent(categoryName)}?subcategory=all`} className="group flex flex-col items-center text-center py-20">
                  <div className="w-37 h-37 bg-primary/10 rounded-full shadow-md flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                    <div className="relative -top-7 z-20 transition-transform duration-700 group-hover:-translate-y-4">
                      <img
                        src={imageUrl || "/placeholder-category.png"}
                        alt={categoryName}
                        className="w-38 h-42 object-cover relative z-10"
                      />
                      <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-20 h-3 bg-black/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
                    </div>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    {categoryName}
                  </p>
                </Link>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
};

export default Category;
