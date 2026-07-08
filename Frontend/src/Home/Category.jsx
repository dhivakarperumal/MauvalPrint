import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import PageContainer from "../Components/PageContainer";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

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
    <div className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,168,45,0.2),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_28%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/100 to-transparent pointer-events-none" />

      <PageContainer className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 mb-14 md:mb-20"
        >
          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.28em] text-slate-300 shadow-sm shadow-slate-900/30">
            Curated Collections
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Shop by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-slate-100 to-yellow-400">Category</span>
          </h2>
          <p className="max-w-3xl text-base leading-8 text-slate-300">
            Explore premium category collections crafted for every design mood. Discover tees, hoodies, round necks and sweatshirts with quality prints and effortless style.
          </p>
        </motion.div>

        <MotionDiv
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 auto-rows-fr"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {categories.map((cat, index) => {
            const imageSource = cat.images || cat.cimgs;
            const imageUrl = Array.isArray(imageSource) ? imageSource[0] : imageSource;
            const categoryName = cat.name || cat.cname || cat.category_id || "Category";
            const productCount = cat.count || cat.totalProducts || cat.items || "20+";

            return (
              <motion.div key={cat.category_id || cat.id || index} variants={itemVariants} className="h-full">
                <Link to={`/products/${encodeURIComponent(categoryName)}?subcategory=all`} className="h-full">
                  <motion.div
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/90 shadow-[0_20px_60px_rgba(15,23,42,0.4)]"
                  >
                    <div className="relative h-full overflow-hidden">
                      <img
                        src={imageUrl || "/placeholder-category.png"}
                        alt={categoryName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-200/80">{productCount} styles</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">{categoryName}</h3>
                        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">
                          Browse premium designs with bold prints and effortless comfort.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </MotionDiv>
      </PageContainer>
    </div>
  );
};

export default Category;
