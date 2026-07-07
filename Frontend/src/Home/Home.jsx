import React from 'react'
import Category from './Category'
import RecentDesigns from './RecentDesigns'
import Hero from './Hero'
import Product from './Product'
import Testimonial from './Testimonial'
import OfferBanner from './OfferBaner'
import OfferBannerLeftImage from './OfferBannerLeftImage'
import TrendingDesigns from './TrendingDesigns'
import ReelsSwiper from './ReelsSwiper'

const Home = () => {
  return (
    <section className='mt-17'>
        {/* <Hero/> */}
        <RecentDesigns/>
        <Product/>
        <Category/>     
        <Testimonial/>
        <ReelsSwiper />
    </section>
  )
}

export default Home