// src/Components/Review.jsx
import React, { useState } from "react";
import Slider from "react-slick";
import {
  FaStar,
  FaQuoteLeft,
  FaQuoteRight,
  FaUserCircle,
} from "react-icons/fa";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "react-toastify";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Review = ({ uname, productname, productId, reviews = [] }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showWriteReview, setShowWriteReview] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment) return toast.error("Please fill all fields");

    const reviewData = {
      username: uname,
      product: productname,
      rating,
      comment,
      date: new Date().toLocaleString(),
    };

    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        reviews: arrayUnion(reviewData),
      });

      toast.success("Review submitted!");
      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Error adding review:", err);
      toast.error("Failed to submit review");
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: reviews.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640, // mobile
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="mt-10">
      <div className="flex justify-between">
        {" "}
        <h1 className="text-center text-xl sm:text-2xl md:text-4xl font-bold">Customer Reviews</h1>
        <button
          onClick={() => setShowWriteReview(!showWriteReview)}
          className="text-md cursor-pointer text-white bg-primary/90 hover:bg-primary px-2 py-1 rounded-full"
        >
          Write a Review
        </button>
      </div>
      {/* Review Form */}
      {showWriteReview && (
        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto bg-white p-6 my-6 rounded-2xl shadow-xl border border-gray-200"
        >
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Write a Review
          </h3>

          {/* Star Rating */}
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`cursor-pointer text-2xl transition-colors duration-200 ${
                  star <= rating ? "text-yellow-500" : "text-gray-300"
                }`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          {/* Review Text */}
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows="4"
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {/* Submit Button */}
          <div className="text-center mt-4">
            <button
              type="submit"
              className="bg-primary/80 hover:bg-primary text-white font-medium px-6 py-2 rounded-full transition duration-200 cursor-pointer"
            >
              Submit Review
            </button>
          </div>
        </form>
      )}
      {/* Reviews Display */}
      {reviews.length === 0 ? (
        <p className="text-gray-600 text-center">No reviews yet.</p>
      ) : (
        <>
          <Slider {...sliderSettings}>
            {reviews.map((review, index) => (
              <div key={index} className="px-3 py-20">
                <div className="bg-primary text-white p-6 rounded-tl-4xl rounded-br-4xl rounded-tr-2xl rounded-bl-2xl shadow-xl relative h-full">
                  <FaQuoteLeft className="absolute top-4 left-4 text-2xl opacity-60" />
                  <div className="flex justify-center mb-4">
                    <div className="bg-primary mb-10 absolute -top-8  rounded-full p-2 shadow-md">
                      <FaUserCircle className="text-white text-5xl" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold">
                      {review?.username || "Anonymous"}
                    </h4>

                    <p className="text-sm text-gray-300">
                      {review.product || "Product"}
                    </p>
                    <p className="text-sm text-gray-200 mt-3 mb-3 leading-relaxed">
                      {review.comment}
                    </p>
                    <div className="flex justify-center text-yellow-400 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar
                          key={i}
                          className={
                            i < review.rating
                              ? "text-yellow-400"
                              : "text-gray-500"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{review.date}</p>
                  </div>
                  <FaQuoteRight className="absolute bottom-4 right-4 text-2xl opacity-60" />
                </div>
              </div>
            ))}
          </Slider>
        </>
      )}
    </div>
  );
};

export default Review;
