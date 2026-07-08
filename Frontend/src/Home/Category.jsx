import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import PageContainer from "../Components/PageContainer";
import { motion } from "framer-motion";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="bg-gradient-to-br from-white via-gray-50/80 to-primary/5 px-6 py-16 md:py-20 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <PageContainer className="relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Shop by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-500">Category</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Explore our curated collections across all categories</p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {categories.map((cat, index) => {
            const imageSource = cat.images || cat.cimgs;
            const imageUrl = Array.isArray(imageSource) ? imageSource[0] : imageSource;
            const categoryName = cat.name || cat.cname || cat.category_id || "Category";

            return (
              <motion.div key={cat.category_id || cat.id || index} variants={itemVariants}>
                <Link to={`/products/${encodeURIComponent(categoryName)}?subcategory=all`}>
                  <motion.div
                    className="group flex flex-col items-center text-center py-8 cursor-pointer"
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Category Card Container */}
                    <div className="relative w-full aspect-square mb-4">
                      {/* Background Gradient */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary/20 to-yellow-400/10 rounded-3xl group-hover:from-primary/40 group-hover:to-yellow-400/30 transition-all duration-300"
                        initial={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                      />

                      {/* Image Container */}
                      <div className="absolute inset-0 flex items-center justify-center rounded-3xl overflow-hidden">
                        <motion.img
                          src={imageUrl || "/placeholder-category.png"}
                          alt={categoryName}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          transition={{ duration: 0.5 }}
                        />
                        
                        {/* Overlay */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                        />
                      </div>

                      {/* Badge */}
                      <motion.div
                        className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-yellow-400 px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                      >
                        Explore
                      </motion.div>
                    </div>

                    {/* Category Name */}
                    <motion.p
                      className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide group-hover:text-primary transition-colors duration-300"
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                    >
                      {categoryName}
                    </motion.p>

                    {/* Underline */}
                    <motion.div
                      className="h-1 bg-gradient-to-r from-primary to-yellow-400 rounded-full mt-2 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: "60%" }}
                    />
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </PageContainer>
    </div>
  );
};

export default Category;
